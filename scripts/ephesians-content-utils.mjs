import { readFileSync } from "node:fs";
import { join } from "node:path";

export const EPHESIANS_VERSE_COUNTS = [23, 22, 21, 32, 33, 24];

export function loadEphesians(root = process.cwd()) {
  return EPHESIANS_VERSE_COUNTS.map((expectedVerses, index) => {
    const chapterNumber = index + 1;
    const path = join(
      root,
      "content",
      "ephesians",
      `chapter-${String(chapterNumber).padStart(2, "0")}.json`
    );
    return {
      chapterNumber,
      expectedVerses,
      path,
      content: JSON.parse(readFileSync(path, "utf8"))
    };
  });
}

export function commentaryFor(reference, chapters) {
  for (const { content } of chapters) {
    const verse = content.verses.find((entry) => entry.verse === reference);
    if (verse) return verse.commentary.detailedExplanation;
  }
  throw new Error(`Missing commentary for ${reference}`);
}

export function collectStringLeaves(value, field = "content", output = []) {
  if (typeof value === "string") {
    output.push({ field, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStringLeaves(entry, `${field}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      collectStringLeaves(child, `${field}.${key}`, output);
    }
  }
  return output;
}

export function collectPublicText(chapters) {
  const output = [];
  for (const { path, content } of chapters) {
    collectStringLeaves(content, path, output);
  }
  return output.filter(({ field }) => (
    !field.includes(".bibleText")
    && !field.includes(".verse")
    && !field.includes(".reviewStatus")
    && !field.includes(".sources")
    && !field.includes(".sourceAudit")
    && !field.includes(".reviewFlags")
  ));
}
