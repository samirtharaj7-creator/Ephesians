import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const verseCounts = [23, 22, 21, 32, 33, 24];
const sourcePath = process.argv[2] ?? process.env.KJV_SOURCE_PATH;
if (!sourcePath) {
  throw new Error("Provide the KJV source path: npm run reset:intake -- /path/to/verses.json");
}
const kjv = JSON.parse(readFileSync(sourcePath, "utf8"));
const target = join(process.cwd(), "content", "ephesians");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const blankCommentary = () => ({
  detailedExplanation: "", exegesis: "", historicalBackground: "", technicalNotes: "",
  theologicalInsight: "", structuralNotes: "", otherCommentaryInsights: "", application: "", reviewFlags: []
});
const blankAudit = () => ({
  exegesis: [], historicalBackground: [], technicalNotes: [], theologicalInsight: [],
  structuralNotes: [], otherCommentaryInsights: [], application: []
});

verseCounts.forEach((verseCount, chapterIndex) => {
  const chapter = chapterIndex + 1;
  const content = {
    chapterNumber: chapter,
    title: "",
    summary: "",
    historicalContext: "",
    literaryContext: "",
    themes: [],
    outline: [],
    verses: Array.from({ length: verseCount }, (_, verseIndex) => {
      const verse = verseIndex + 1;
      const reference = `Ephesians ${chapter}:${verse}`;
      if (!kjv[reference]) throw new Error(`Missing KJV text for ${reference}`);
      return {
        verse: reference,
        bibleText: kjv[reference].replaceAll("[", "").replaceAll("]", ""),
        explanation: "", historicalBackground: "", literaryContext: "", theologicalInsight: "",
        structuralNotes: "", relatedConnection: "", crossReferences: [], application: "", sources: [],
        commentary: blankCommentary(), wordNotes: [], sourceAudit: blankAudit(), reviewStatus: "placeholder"
      };
    }),
    symbols: [], charts: [], images: [], crossReferences: [], relatedConnections: [],
    teachingNotes: { openingQuestion: "", mainPoint: "", keyVerses: [], importantTerms: [], discussionQuestions: [], commonMisunderstandings: [], emphasis: "", closingAppeal: "" },
    evangelisticNotes: { mainDoctrinalTheme: "", keyBibleTexts: [], flow: [], simpleIllustrations: [], appealQuestion: "", cautions: [], sources: [] },
    reflectionQuestions: [], sources: []
  };
  writeFileSync(join(target, `chapter-${String(chapter).padStart(2, "0")}.json`), `${JSON.stringify(content, null, 2)}\n`);
});
