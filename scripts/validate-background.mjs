import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectStringLeaves, EPHESIANS_VERSE_COUNTS } from "./ephesians-content-utils.mjs";

const path = join(process.cwd(), "content", "background.json");
const background = JSON.parse(readFileSync(path, "utf8"));
const kjv = JSON.parse(readFileSync(join(process.cwd(), "lib", "generated", "kjv-reference-verses.json"), "utf8"));
const errors = [];
const strings = collectStringLeaves(background, path);
const publicText = strings.map(({ value }) => value).join("\n");
const singleChapterBooks = new Set(["Obadiah", "Philemon", "2 John", "3 John", "Jude"]);
const scriptureBooks = new Set(Object.keys(kjv).map((reference) => reference.replace(/ \d+:\d+$/u, "")));
const scriptureBookPattern = [...scriptureBooks]
  .sort((left, right) => right.length - left.length)
  .map((book) => book.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
  .join("|");
const fullReferencePattern = new RegExp(
  `\\b(${scriptureBookPattern}) (\\d+):(\\d+)(?:[-–—](\\d+))?`,
  "gu"
);

function normalizeBook(rawBook) {
  if (rawBook === "Psalm") return "Psalms";
  if (rawBook === "Song of Songs" || rawBook === "Song of Solomon") return "Solomon's Song";
  return rawBook;
}

function validateReference(bookName, chapter, startVerse, endVerse, context) {
  const book = normalizeBook(bookName);
  const resolvedChapter = chapter ?? (singleChapterBooks.has(book) ? 1 : Number.NaN);
  if (![resolvedChapter, startVerse, endVerse].every(Number.isSafeInteger) || endVerse < startVerse) {
    errors.push(`${context}: malformed Scripture reference`);
    return;
  }
  for (let verse = startVerse; verse <= endVerse; verse += 1) {
    if (!kjv[`${book} ${resolvedChapter}:${verse}`]) {
      errors.push(`${context}: KJV corpus has no ${book} ${resolvedChapter}:${verse}`);
      return;
    }
  }
}

if (!background.title?.trim() || !background.subtitle?.trim()) errors.push(`${path}: title and subtitle must be populated`);
if (!Array.isArray(background.sections) || background.sections.length !== 8) {
  errors.push(`${path}: expected the reviewed eight-section introduction`);
} else {
  const ids = new Set();
  background.sections.forEach((section, sectionIndex) => {
    const context = `${path}.sections[${sectionIndex}]`;
    if (!section.id?.trim() || !section.title?.trim()) errors.push(`${context}: id and title must be populated`);
    if (ids.has(section.id)) errors.push(`${context}: duplicate section id ${section.id}`);
    ids.add(section.id);
    if (!Array.isArray(section.blocks) || !section.blocks.length) errors.push(`${context}: blocks must be nonempty`);
    section.blocks?.forEach((block, blockIndex) => {
      const blockContext = `${context}.blocks[${blockIndex}]`;
      if (!new Set(["paragraph", "heading", "subsection", "comparison"]).has(block.type)) {
        errors.push(`${blockContext}: unsupported block type ${block.type}`);
      }
      if (block.type === "paragraph" && !block.text?.trim()) errors.push(`${blockContext}: paragraph text is blank`);
      if (block.type === "heading" && !block.title?.trim()) errors.push(`${blockContext}: heading title is blank`);
      if (block.type === "subsection") {
        if (!block.title?.trim() || !Array.isArray(block.body) || !block.body.length) {
          errors.push(`${blockContext}: subsection title and body must be populated`);
        }
        block.body?.forEach((paragraph, index) => {
          if (!paragraph?.trim()) errors.push(`${blockContext}.body[${index}]: paragraph is blank`);
        });
      }
      if (block.type === "comparison") {
        if (!block.title?.trim() || !Array.isArray(block.headers) || block.headers.length < 2) {
          errors.push(`${blockContext}: comparison title and headers must be populated`);
        }
        if (!Array.isArray(block.rows) || !block.rows.length) errors.push(`${blockContext}: comparison rows must be nonempty`);
        block.rows?.forEach((row, rowIndex) => {
          if (row.length !== block.headers.length) errors.push(`${blockContext}.rows[${rowIndex}]: row/header width mismatch`);
          if (row.some((cell) => !cell?.trim())) errors.push(`${blockContext}.rows[${rowIndex}]: cells must be nonblank`);
        });
      }
    });
  });
}

for (const { field, value } of strings) {
  if (/\b(?:TODO|TBD|placeholder|lorem ipsum)\b/i.test(value)) errors.push(`${field}: contains placeholder language`);
  if (/https?:\/\/|\bwww\.|file:\/\/|\/(?:Users|home|private|tmp)\//i.test(value)) {
    errors.push(`${field}: contains a public URL or local path`);
  }
  const openQuotes = (value.match(/“/gu) ?? []).length;
  const closeQuotes = (value.match(/”/gu) ?? []).length;
  if (openQuotes !== closeQuotes) errors.push(`${field}: contains unbalanced smart quotation marks`);
  if (/\t| {2,}/u.test(value)) errors.push(`${field}: contains tabs or repeated spaces`);

  for (const match of value.matchAll(fullReferencePattern)) {
    validateReference(match[1], Number(match[2]), Number(match[3]), Number(match[4] ?? match[3]), `${field}: ${match[0]}`);
  }
  for (const match of value.matchAll(/\((\d+):(\d+)(?:[-–—](\d+))?\)/gu)) {
    const chapter = Number(match[1]);
    const startVerse = Number(match[2]);
    const endVerse = Number(match[3] ?? match[2]);
    if (
      chapter < 1
      || chapter > EPHESIANS_VERSE_COUNTS.length
      || startVerse < 1
      || endVerse < startVerse
      || endVerse > EPHESIANS_VERSE_COUNTS[chapter - 1]
    ) {
      errors.push(`${field}: invalid bare Ephesians reference ${match[0]}`);
    }
  }
}

const wordCount = publicText.split(/\s+/u).filter(Boolean).length;
if (wordCount < 5_000) errors.push(`${path}: expected a substantive introduction; found ${wordCount} words`);

const requiredControls = [
  [/salvation (?:is|originates).*grace/is, "salvation grounded in grace"],
  [/good works (?:are not|do not)[^.!?]{0,100}(?:cause|purchase|earn)/is, "works excluded as the cause of salvation"],
  [/Ephesians 2:15 speaks[^]{0,250}should not be interpreted as the abolition of God.s moral will/is, "moral-law safeguard for Ephesians 2:15"],
  [/election in Christ/is, "Christ-centered election"],
  [/should not be turned into fatalism/is, "non-fatalist election safeguard"],
  [/resurrection|raises? the dead/is, "resurrection hope"],
  [/great controversy/is, "great-conflict framework"],
  [/Christ[^.!?]{0,120}(?:above every principality|defeated the powers|supremacy)/is, "Christ’s supremacy over evil powers"]
];
for (const [pattern, label] of requiredControls) {
  if (!pattern.test(publicText)) errors.push(`${path}: missing ${label}`);
}

if (errors.length) {
  console.error(`Ephesians background validation failed with ${errors.length} error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Ephesians background validation passed: ${background.sections.length} sections, `
  + `${background.sections.reduce((total, section) => total + section.blocks.length, 0)} blocks, `
  + `${wordCount.toLocaleString()} words, valid Scripture references, and ${requiredControls.length} theological controls.`
);
