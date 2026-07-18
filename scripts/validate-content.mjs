import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectPublicText, EPHESIANS_VERSE_COUNTS, loadEphesians } from "./ephesians-content-utils.mjs";

const chapters = loadEphesians();
const kjv = JSON.parse(readFileSync(join(process.cwd(), "lib", "generated", "kjv-reference-verses.json"), "utf8"));
const errors = [];
const detailedExplanations = new Map();
let verseTotal = 0;
let commentaryWords = 0;
let crossReferenceTotal = 0;
let wordNoteTotal = 0;

const singleChapterBooks = new Set(["Obadiah", "Philemon", "2 John", "3 John", "Jude"]);
const emptyVerseFields = [
  "explanation",
  "historicalBackground",
  "literaryContext",
  "theologicalInsight",
  "structuralNotes",
  "relatedConnection",
  "application"
];
const emptyCommentaryFields = [
  "exegesis",
  "historicalBackground",
  "technicalNotes",
  "theologicalInsight",
  "structuralNotes",
  "otherCommentaryInsights",
  "application"
];

function normalizeBook(rawBook) {
  if (rawBook === "Psalm") return "Psalms";
  if (rawBook === "Song of Songs" || rawBook === "Song of Solomon") return "Solomon's Song";
  return rawBook;
}

function parseScriptureReference(citation, context) {
  if (typeof citation !== "string" || !citation.trim()) {
    errors.push(`${context}: reference must be a nonblank string`);
    return null;
  }
  const match = citation.trim().match(
    /^((?:[1-3] )?[A-Za-z]+(?: [A-Za-z]+)*) (?:(\d+):)?(\d+)(?:[-–—](\d+))?$/u
  );
  if (!match) {
    errors.push(`${context}: invalid Scripture reference ${citation}`);
    return null;
  }
  const [, rawBook, rawChapter, startText, endText] = match;
  const book = normalizeBook(rawBook);
  const chapter = rawChapter ? Number(rawChapter) : singleChapterBooks.has(book) ? 1 : Number.NaN;
  const startVerse = Number(startText);
  const endVerse = Number(endText ?? startText);
  if (![chapter, startVerse, endVerse].every(Number.isSafeInteger) || chapter < 1 || startVerse < 1) {
    errors.push(`${context}: invalid chapter or verse in ${citation}`);
    return null;
  }
  if (endVerse < startVerse) {
    errors.push(`${context}: reversed verse range ${citation}`);
    return null;
  }
  for (let verse = startVerse; verse <= endVerse; verse += 1) {
    if (!kjv[`${book} ${chapter}:${verse}`]) {
      errors.push(`${context}: KJV corpus has no ${book} ${chapter}:${verse}`);
      return null;
    }
  }
  return { book, chapter, startVerse, endVerse };
}

function validatePrivateFieldsAreEmpty(value, field) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validatePrivateFieldsAreEmpty(entry, `${field}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childField = `${field}.${key}`;
    if (key === "sources" || key === "reviewFlags") {
      if (!Array.isArray(child)) errors.push(`${childField} must be an array`);
      else if (child.length) errors.push(`${childField} must remain empty`);
      continue;
    }
    if (key === "sourceAudit") {
      if (!child || typeof child !== "object" || Array.isArray(child)) {
        errors.push(`${childField} must be an object of empty arrays`);
      } else {
        for (const [category, values] of Object.entries(child)) {
          if (!Array.isArray(values)) errors.push(`${childField}.${category} must be an array`);
          else if (values.length) errors.push(`${childField}.${category} must remain empty`);
        }
      }
      continue;
    }
    validatePrivateFieldsAreEmpty(child, childField);
  }
}

function validateEditorialString(value, context) {
  if (/\b(?:TODO|TBD|placeholder|lorem ipsum)\b/i.test(value)) {
    errors.push(`${context}: contains placeholder language`);
  }
  if (/https?:\/\/|\bwww\.|file:\/\/|\/(?:Users|home|private|tmp)\//i.test(value)) {
    errors.push(`${context}: contains a public URL or local path`);
  }
  if (/\b(?:this|the) (?:letter|epistle|book) (?:to|of) (?:Hebrews|Colossians|Philippians|Galatians|Romans|Corinthians)\b/i.test(value)) {
    errors.push(`${context}: contains a wrong-book identity phrase`);
  }
  if (/\b(?:Hebrews|Colossians|Philippians|Galatians|Romans|Corinthians) chapter \d+\b/i.test(value)) {
    errors.push(`${context}: contains a suspicious wrong-book chapter phrase`);
  }
  if (/\b([A-Za-z]{4,})\s+\1\b/i.test(value)) {
    errors.push(`${context}: contains an adjacent repeated word`);
  }
  const openQuotes = (value.match(/“/gu) ?? []).length;
  const closeQuotes = (value.match(/”/gu) ?? []).length;
  if (openQuotes !== closeQuotes) errors.push(`${context}: contains unbalanced smart quotation marks`);
  if (/\t| {2,}/u.test(value)) errors.push(`${context}: contains tabs or repeated spaces`);
}

function parseOutlineRange(range, chapterNumber, context) {
  const match = range.match(/^(\d+):(\d+)(?:[-–—](\d+))?$/u);
  if (!match) {
    errors.push(`${context}: invalid outline range ${range}`);
    return null;
  }
  const chapter = Number(match[1]);
  const startVerse = Number(match[2]);
  const endVerse = Number(match[3] ?? match[2]);
  if (chapter !== chapterNumber || endVerse < startVerse) {
    errors.push(`${context}: outline range must be ordered and remain in Ephesians ${chapterNumber}`);
    return null;
  }
  return { startVerse, endVerse };
}

for (const { chapterNumber, expectedVerses, path, content } of chapters) {
  if (content.chapterNumber !== chapterNumber) errors.push(`${path}: chapterNumber must be ${chapterNumber}`);
  if (!Array.isArray(content.verses) || content.verses.length !== expectedVerses) {
    errors.push(`${path}: expected ${expectedVerses} verses, found ${content.verses?.length ?? "none"}`);
    continue;
  }
  if (!content.title?.trim() || content.title.trim().length < 10) errors.push(`${path}: title must be substantive`);
  if (!content.summary?.trim() || content.summary.trim().length < 80) errors.push(`${path}: summary must be substantive`);
  if (!content.literaryContext?.trim() || content.literaryContext.trim().length < 120) {
    errors.push(`${path}: literaryContext must be substantive`);
  }
  if (!Array.isArray(content.themes) || content.themes.length < 4) errors.push(`${path}: provide at least four themes`);
  if (new Set(content.themes).size !== content.themes.length) errors.push(`${path}: themes must be unique`);
  if (!Array.isArray(content.outline) || content.outline.length < 3) {
    errors.push(`${path}: provide at least three outline sections`);
  } else {
    let expectedStart = 1;
    content.outline.forEach((section, index) => {
      const context = `${path}: outline[${index}]`;
      if (!section.title?.trim() || !section.summary?.trim()) errors.push(`${context}: title and summary must be populated`);
      const parsed = parseOutlineRange(section.range, chapterNumber, context);
      if (!parsed) return;
      if (parsed.startVerse !== expectedStart) {
        errors.push(`${context}: expected outline to start at verse ${expectedStart}`);
      }
      expectedStart = parsed.endVerse + 1;
    });
    if (expectedStart !== expectedVerses + 1) errors.push(`${path}: outline must cover all ${expectedVerses} verses exactly once`);
  }

  verseTotal += content.verses.length;
  content.verses.forEach((verse, index) => {
    const expectedReference = `Ephesians ${chapterNumber}:${index + 1}`;
    const context = `${path}: ${expectedReference}`;
    if (verse.verse !== expectedReference) errors.push(`${context}: found verse slot ${verse.verse}`);
    const expectedKjv = kjv[expectedReference];
    const displayKjv = expectedKjv?.replaceAll("[", "").replaceAll("]", "");
    if (!expectedKjv) errors.push(`${context}: KJV corpus is missing the expected verse`);
    else if (verse.bibleText !== displayKjv) {
      errors.push(`${context}: bibleText does not match the canonical KJV corpus after removing supplied-word brackets`);
    }
    if (verse.reviewStatus !== "verified-seed") errors.push(`${context}: reviewStatus must be verified-seed`);

    const commentary = verse.commentary?.detailedExplanation?.trim() ?? "";
    const words = commentary.split(/\s+/u).filter(Boolean).length;
    const paragraphs = commentary.split(/\n\n+/u).filter(Boolean);
    commentaryWords += words;
    if (words < 140 || words > 650) errors.push(`${context}: commentary must contain 140–650 words; found ${words}`);
    if (paragraphs.length < 3 || paragraphs.length > 10) {
      errors.push(`${context}: commentary must contain 3–10 coherent paragraphs; found ${paragraphs.length}`);
    }
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph.trim().length < 60) errors.push(`${context}: paragraph ${paragraphIndex + 1} is too short`);
      if (!/[.!?…”’)]$/u.test(paragraph.trim())) errors.push(`${context}: paragraph ${paragraphIndex + 1} lacks terminal punctuation`);
    });
    validateEditorialString(commentary, `${context}.commentary.detailedExplanation`);
    const duplicate = detailedExplanations.get(commentary);
    if (duplicate) errors.push(`${context}: commentary duplicates ${duplicate}`);
    else detailedExplanations.set(commentary, expectedReference);

    for (const field of emptyVerseFields) {
      if (verse[field]?.trim()) errors.push(`${context}: ${field} must remain empty; public prose belongs in commentary.detailedExplanation`);
    }
    for (const field of emptyCommentaryFields) {
      if (verse.commentary?.[field]?.trim()) errors.push(`${context}: commentary.${field} must remain empty`);
    }

    if (!Array.isArray(verse.crossReferences) || verse.crossReferences.length < 3 || verse.crossReferences.length > 8) {
      errors.push(`${context}: crossReferences must contain 3–8 selective references`);
    } else {
      const seen = new Set();
      verse.crossReferences.forEach((citation, referenceIndex) => {
        crossReferenceTotal += 1;
        const citationContext = `${context}.crossReferences[${referenceIndex}]`;
        const parsed = parseScriptureReference(citation, citationContext);
        const normalized = citation.trim().toLowerCase().replace(/[–—]/gu, "-");
        if (seen.has(normalized)) errors.push(`${citationContext}: duplicate reference ${citation}`);
        seen.add(normalized);
        if (
          parsed?.book === "Ephesians"
          && parsed.chapter === chapterNumber
          && parsed.startVerse <= index + 1
          && parsed.endVerse >= index + 1
        ) {
          errors.push(`${citationContext}: must not cite its own verse or a range containing it`);
        }
      });
    }

    if (!Array.isArray(verse.wordNotes) || verse.wordNotes.length > 2) {
      errors.push(`${context}: wordNotes must be an array with no more than two entries`);
    } else {
      const terms = new Set();
      verse.wordNotes.forEach((note, noteIndex) => {
        wordNoteTotal += 1;
        const noteContext = `${context}.wordNotes[${noteIndex}]`;
        if (!note.term?.trim()) errors.push(`${noteContext}: term must be populated`);
        if (terms.has(note.term?.trim())) errors.push(`${noteContext}: term duplicates another note`);
        terms.add(note.term?.trim());
        if (!note.explanation?.trim() || note.explanation.trim().length < 60) {
          errors.push(`${noteContext}: explanation must be substantive`);
        } else {
          validateEditorialString(note.explanation, `${noteContext}.explanation`);
        }
        if (/[Ͱ-Ͽἀ-῿]/u.test(note.term ?? "") && !/[([](?=[^\])]*\p{Script=Latin})[^\])]+[\])]/u.test(note.term)) {
          errors.push(`${noteContext}: Greek text must be paired with a Latin transliteration`);
        }
        if (!Array.isArray(note.scriptureReferences) || note.scriptureReferences.length < 2 || note.scriptureReferences.length > 4) {
          errors.push(`${noteContext}: scriptureReferences must contain 2–4 references`);
        } else {
          const noteReferences = new Set();
          note.scriptureReferences.forEach((citation, referenceIndex) => {
            parseScriptureReference(citation, `${noteContext}.scriptureReferences[${referenceIndex}]`);
            const normalized = citation.trim().toLowerCase().replace(/[–—]/gu, "-");
            if (noteReferences.has(normalized)) errors.push(`${noteContext}: duplicate Scripture reference ${citation}`);
            noteReferences.add(normalized);
          });
        }
      });
    }
  });
  validatePrivateFieldsAreEmpty(content, path);
}

for (const { field, value } of collectPublicText(chapters)) validateEditorialString(value, field);

const expectedVerseTotal = EPHESIANS_VERSE_COUNTS.reduce((total, count) => total + count, 0);
if (verseTotal !== expectedVerseTotal) errors.push(`Expected ${expectedVerseTotal} total verses, found ${verseTotal}`);
if (commentaryWords < 40_000) errors.push(`Expected a substantive commentary corpus, found only ${commentaryWords} words`);

if (errors.length) {
  console.error(`Ephesians content validation failed with ${errors.length} error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Ephesians content validation passed: ${chapters.length} chapters, ${verseTotal} verified KJV/commentary records, `
  + `${commentaryWords.toLocaleString()} commentary words, ${crossReferenceTotal} cross references, `
  + `${wordNoteTotal} word notes, and empty private audit/source fields.`
);
