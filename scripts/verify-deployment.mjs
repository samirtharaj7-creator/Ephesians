import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve(process.cwd(), "out");
const productionDomain = "ephesians.mybibleexplorer.com";
const requiredFiles = [
  "index.html",
  "404.html",
  ".nojekyll",
  "CNAME",
  "background/index.html",
  "articles/index.html",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "icon.png",
  "apple-icon.png",
  "og.png",
  "assets/ephesians-hero-engraving.webp",
  "assets/my-bible-explorer-logo.png",
  ...Array.from({ length: 6 }, (_, index) => `ephesians/${index + 1}/index.html`)
];

const missingFiles = [];
for (const relativePath of requiredFiles) {
  if (!(await exists(path.join(outputRoot, relativePath)))) missingFiles.push(relativePath);
}

if (missingFiles.length > 0) {
  fail(`Missing deployment files:\n${missingFiles.map((file) => `  - out/${file}`).join("\n")}`);
}

const cname = (await readFile(path.join(outputRoot, "CNAME"), "utf8")).trim();
if (cname !== productionDomain) {
  fail(`out/CNAME must contain exactly ${productionDomain}; found ${JSON.stringify(cname)}.`);
}

const socialCard = await stat(path.join(outputRoot, "og.png"));
if (socialCard.size < 50_000) fail("out/og.png is unexpectedly small.");

const htmlFiles = (await listFiles(outputRoot)).filter((file) => file.endsWith(".html"));
const forbiddenText = ["/Users/", "needs-source-review", "sourceAudit", "reviewFlags"];
const leaks = [];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const match = forbiddenText.find((text) => html.includes(text));
  if (match) leaks.push(`${path.relative(outputRoot, file)} contains ${JSON.stringify(match)}`);
}

if (leaks.length > 0) {
  fail(`Private development data reached the static export:\n${leaks.map((item) => `  - ${item}`).join("\n")}`);
}

console.log(`Deployment artifact verified: ${requiredFiles.length} required files, ${htmlFiles.length} HTML pages, custom domain, and privacy checks passed.`);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : [filePath];
  }));
  return nested.flat();
}

function fail(message) {
  console.error(`Deployment verification failed.\n${message}`);
  process.exit(1);
}
