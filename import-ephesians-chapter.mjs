import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, chapterPath] = process.argv.slice(2);
if (!inputPath || !chapterPath) {
  throw new Error("Usage: node import-ephesians-chapter.mjs <input.json> <chapter.json>");
}

const incoming = JSON.parse(readFileSync(inputPath, "utf8"));
const chapter = JSON.parse(readFileSync(chapterPath, "utf8"));
const byVerse = new Map(incoming.map((entry) => [entry.verse, entry]));

function normalizeReferences(references = []) {
  const expanded = references.flatMap((reference) => {
    const match = reference.match(/^(.+?\s+\d+):(.+)$/);
    if (!match || !match[2].includes(",")) return [reference];
    const parts = match[2].split(",").map((part) => part.trim());
    if (!parts.every((part) => /^\d+(?:[-–—]\d+)?$/.test(part))) return [reference];
    return parts.map((part) => `${match[1]}:${part}`);
  });
  return expanded.map((reference) => reference
    .replace(/^Psalm\s+/i, "Psalms "));
}

chapter.verses = chapter.verses.map((verse) => {
  const entry = byVerse.get(verse.verse);
  if (!entry) return verse;
  return {
    ...verse,
    crossReferences: normalizeReferences(entry.crossReferences),
    commentary: {
      ...verse.commentary,
      detailedExplanation: entry.commentary?.detailedExplanation ?? ""
    },
    wordNotes: (entry.wordNotes ?? []).map((note) => ({
      term: [note.label, note.original, note.transliteration ? `(${note.transliteration})` : ""]
        .filter(Boolean)
        .join(" — ")
        .replace(" — (", " ("),
      explanation: note.explanation ?? "",
      scriptureReferences: normalizeReferences(note.references)
    })),
    reviewStatus: "needs-source-review"
  };
});

const missing = incoming.filter((entry) => !chapter.verses.some((verse) => verse.verse === entry.verse));
if (missing.length) throw new Error(`Unknown verse entries: ${missing.map((entry) => entry.verse).join(", ")}`);
if (byVerse.size !== chapter.verses.length) {
  throw new Error(`Expected ${chapter.verses.length} entries, received ${byVerse.size}`);
}

writeFileSync(chapterPath, `${JSON.stringify(chapter, null, 2)}\n`);
