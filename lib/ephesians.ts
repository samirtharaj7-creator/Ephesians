import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChapterContentSchema, type ChapterContent } from "@/lib/schemas";
import { padChapter } from "@/lib/utils";

export const EPHESIANS = {
  slug: "ephesians",
  name: "Ephesians",
  chapterCount: 6,
  verseCounts: [23, 22, 21, 32, 33, 24]
} as const;

export type ChapterAdjacency = { previous: number | null; next: number | null };

export function getEphesiansStaticParams() {
  return Array.from({ length: EPHESIANS.chapterCount }, (_, index) => ({ chapter: String(index + 1) }));
}

export function parseEphesiansChapterNumber(chapter: number | string): number | null {
  const rawChapter = String(chapter);
  if (!/^[1-9]\d*$/.test(rawChapter)) return null;
  const chapterNumber = Number(rawChapter);
  if (!Number.isSafeInteger(chapterNumber) || chapterNumber > EPHESIANS.chapterCount) return null;
  return chapterNumber;
}

export function getEphesiansChapter(chapter: number | string): ChapterContent | null {
  const chapterNumber = parseEphesiansChapterNumber(chapter);
  if (chapterNumber === null) return null;
  const path = join(process.cwd(), "content", EPHESIANS.slug, `chapter-${padChapter(chapterNumber)}.json`);
  if (!existsSync(path)) return null;
  const parsed = ChapterContentSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  const expectedVerseCount = EPHESIANS.verseCounts[chapterNumber - 1];
  if (parsed.chapterNumber !== chapterNumber || parsed.verses.length !== expectedVerseCount) {
    throw new Error(`Ephesians ${chapterNumber} content structure is invalid.`);
  }
  parsed.verses.forEach((verse, index) => {
    if (verse.verse !== `Ephesians ${chapterNumber}:${index + 1}`) {
      throw new Error(`Ephesians ${chapterNumber} contains an invalid verse slot.`);
    }
  });
  return parsed;
}

export function getEphesiansChapterAdjacency(chapter: number | string): ChapterAdjacency | null {
  const chapterNumber = parseEphesiansChapterNumber(chapter);
  if (chapterNumber === null) return null;
  return {
    previous: chapterNumber > 1 ? chapterNumber - 1 : null,
    next: chapterNumber < EPHESIANS.chapterCount ? chapterNumber + 1 : null
  };
}
