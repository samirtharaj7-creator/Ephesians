import { readFileSync, writeFileSync } from "node:fs";

const [sourcePath = "", outputPath = "content/background.json"] = process.argv.slice(2);
if (!sourcePath) throw new Error("Provide the source Markdown path.");

const cleanInline = (value) => value
  .trim()
  .replace(/^>\s?/, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/\*(.*?)\*/g, "$1")
  .replace(/`(.*?)`/g, "$1")
  .replace(/\s+$/g, "");

const slugify = (value) => value
  .toLowerCase()
  .replace(/^\d+\.\s*/, "")
  .replace(/[’'“”"]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const lines = readFileSync(sourcePath, "utf8").replace(/\r/g, "").split("\n");
const title = cleanInline(lines.find((line) => line.startsWith("# "))?.slice(2) ?? "Ephesians");
const sections = [];
let section = null;
let subsectionTitle = "";
let subsectionBody = [];
let paragraphLines = [];
let listItems = [];

function ensureSection() {
  if (!section) throw new Error("Content appeared before the first section.");
}

function flushParagraph() {
  if (!paragraphLines.length) return;
  const paragraph = cleanInline(paragraphLines.map(cleanInline).join(" ").replace(/\s+/g, " "));
  paragraphLines = [];
  if (!paragraph) return;
  if (subsectionTitle) subsectionBody.push(paragraph);
  else section.blocks.push({ type: "paragraph", text: paragraph });
}

function flushList() {
  if (!listItems.length) return;
  const text = listItems.map((item) => `• ${cleanInline(item)}`).join("\n");
  listItems = [];
  if (subsectionTitle) subsectionBody.push(text);
  else section.blocks.push({ type: "paragraph", text });
}

function flushSubsection() {
  flushParagraph();
  flushList();
  if (!subsectionTitle) return;
  if (!subsectionBody.length) subsectionBody.push("This theme is developed throughout the section that follows.");
  section.blocks.push({ type: "subsection", title: subsectionTitle, body: subsectionBody });
  subsectionTitle = "";
  subsectionBody = [];
}

function flushSection() {
  if (!section) return;
  flushSubsection();
  if (!section.blocks.length) throw new Error(`Section ${section.title} is empty.`);
  sections.push(section);
  section = null;
}

for (let index = 0; index < lines.length; index += 1) {
  const raw = lines[index];
  const line = raw.trim();
  if (!line || line === "---") {
    flushParagraph();
    flushList();
    continue;
  }
  if (line.startsWith("# ")) continue;
  if (line.startsWith("## ")) {
    flushSection();
    const sectionTitle = cleanInline(line.slice(3)).replace(/^\d+\.\s*/, "");
    section = { id: slugify(sectionTitle), title: sectionTitle, blocks: [] };
    continue;
  }
  ensureSection();
  if (line.startsWith("### ") || line.startsWith("#### ")) {
    flushSubsection();
    subsectionTitle = cleanInline(line.replace(/^#{3,4}\s+/, ""));
    continue;
  }
  if (line.startsWith("|")) {
    flushSubsection();
    const tableLines = [];
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      tableLines.push(lines[index].trim());
      index += 1;
    }
    index -= 1;
    const cells = tableLines.map((tableLine) => tableLine
      .slice(1, -1)
      .split("|")
      .map((cell) => cleanInline(cell)));
    const [headers, divider, ...rows] = cells;
    if (!divider.every((cell) => /^:?-{3,}:?$/.test(cell))) throw new Error(`Malformed table in ${section.title}`);
    section.blocks.push({ type: "comparison", title: `${section.title} overview`, headers, rows });
    continue;
  }
  if (section.title === "The Book at a Glance") {
    const fact = line.match(/^\*\*(.+?):\*\*\s*(.+)$/);
    if (fact) {
      let table = section.blocks.find((block) => block.type === "comparison");
      if (!table) {
        table = { type: "comparison", title: "Ephesians at a glance", headers: ["Detail", "Information"], rows: [] };
        section.blocks.push(table);
      }
      table.rows.push([cleanInline(fact[1]), cleanInline(fact[2])]);
      continue;
    }
  }
  if (/^(?:[-*]|\d+\.)\s+/.test(line)) {
    flushParagraph();
    listItems.push(line.replace(/^(?:[-*]|\d+\.)\s+/, ""));
    continue;
  }
  if (line.startsWith(">")) {
    flushList();
    paragraphLines.push(cleanInline(line));
    continue;
  }
  flushList();
  paragraphLines.push(line);
}
flushSection();

const sourceSections = new Map(sections.map((entry) => [entry.title, entry]));
const groups = [
  {
    title: "Author, Date, and Place",
    sources: ["The Title of the Letter", "Authorship", "Date and Place of Writing"]
  },
  {
    title: "Readers and the Ephesian Church",
    sources: ["The Original Readers", "The Establishment of the Ephesian Church"]
  },
  {
    title: "Ephesus and Its World",
    sources: ["The City of Ephesus"]
  },
  {
    title: "Circumstances, Purpose, and Main Message",
    sources: ["The Circumstances Behind the Letter", "Paul’s Purpose in Writing"]
  },
  {
    title: "Literary Character and Biblical Foundations",
    sources: ["Ephesians and Colossians", "Literary Character", "Old Testament Foundations"]
  },
  {
    title: "Major Images and Theological Themes",
    sources: ["Major Images of the Church", "Major Theological Themes"]
  },
  {
    title: "The Structure of Ephesians",
    sources: ["Structure of Ephesians", "The Book at a Glance"],
    omitFirstHeading: true
  },
  {
    title: "The Message in Its Historical Setting",
    sources: ["The Message of Ephesians in Its Historical Setting", "Central Message"],
    omitFirstHeading: true
  }
];

const groupedSections = groups.map((group) => {
  const blocks = [];
  group.sources.forEach((sourceTitle, sourceIndex) => {
    const source = sourceSections.get(sourceTitle);
    if (!source) throw new Error(`Missing source section: ${sourceTitle}`);
    const needsHeading = group.sources.length > 1 && !(group.omitFirstHeading && sourceIndex === 0);
    if (needsHeading) blocks.push({ type: "heading", title: sourceTitle });
    blocks.push(...source.blocks);
  });
  return { id: slugify(group.title), title: group.title, blocks };
});

if (sourceSections.size !== groups.flatMap((group) => group.sources).length) {
  throw new Error("The grouping map does not account for every source section.");
}

const content = {
  title,
  subtitle: "A comprehensive guide to the historical setting, literary design, theological themes, and central message of Ephesians.",
  sections: groupedSections
};

writeFileSync(outputPath, `${JSON.stringify(content, null, 2)}\n`);
