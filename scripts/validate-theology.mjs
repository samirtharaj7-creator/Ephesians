import { readFileSync } from "node:fs";
import { commentaryFor, collectPublicText, collectStringLeaves, loadEphesians } from "./ephesians-content-utils.mjs";

const chapters = loadEphesians();
const background = JSON.parse(readFileSync("content/background.json", "utf8"));
const errors = [];
let reviewed = 0;

for (const { content } of chapters) {
  for (const verse of content.verses) {
    if (verse.reviewStatus === "verified-seed") reviewed += 1;
    else errors.push(`${verse.verse}: expected reviewStatus verified-seed, found ${verse.reviewStatus}`);
  }
}

const publicText = [
  ...collectPublicText(chapters),
  ...collectStringLeaves(background, "content/background.json")
];
const prohibitedPublicPatterns = [
  [/https?:\/\/|\bwww\./i, "public URL"],
  [/file:\/\/|\/(?:Users|home|private|tmp)\//i, "local filesystem path"],
  [/\b(?:TODO|TBD|placeholder|lorem ipsum)\b/i, "placeholder language"],
  [/according to (?:our|the) (?:private )?(?:source|sources|research|corpus)/i, "private research-process attribution"],
  [/\bsourceAudit\b|\breviewFlags\b|\bsourceId\b/i, "private audit-field name"],
  [/\b(?:this|the) (?:letter|epistle|book) (?:to|of) (?:Hebrews|Colossians|Philippians|Galatians|Romans|Corinthians)\b/i, "wrong-book identity phrase"],
  [/\b(?:Hebrews|Colossians|Philippians|Galatians|Romans|Corinthians) chapter \d+\b/i, "wrong-book chapter phrase"]
];

for (const { field, value } of publicText) {
  for (const [pattern, label] of prohibitedPublicPatterns) {
    if (pattern.test(value)) errors.push(`${field}: contains ${label}`);
  }
}

const assertions = [
  { reference: "Ephesians 1:4", patterns: [/chosen.*in (?:Him|Christ)/is, /faith|gospel appeal/is, /holy and without blame|holiness/is] },
  { reference: "Ephesians 1:5", patterns: [/predestinat/is, /destination|adoption/is, /eternal Son/is, /not one adopted child|not.*adopted/is] },
  { reference: "Ephesians 1:7", patterns: [/sacrificial death|once-for-all self-offering/is, /Father and Son act together|united saving/is, /resurrection|redemption of the body/is] },
  { reference: "Ephesians 1:10", patterns: [/not mean.*evil.*eternally|evil is eternally preserved/is, /judgment/is, /destruction.*evil|remove sin and death/is] },
  { reference: "Ephesians 1:13", patterns: [/Holy Spirit Himself|Spirit.*personal/is, /not.*presumption|presumption/is, /continuing trust and obedience/is] },
  { reference: "Ephesians 1:14", patterns: [/dead await resurrection/is, /Christ.s return/is, /not exhausted.*heaven after death|not.*conscious.*after death/is] },
  { reference: "Ephesians 1:20", patterns: [/bodily/is, /not the survival of a naturally immortal consciousness/is, /continuing heavenly ministry|actively reigns, intercedes/is] },
  { reference: "Ephesians 2:3", patterns: [/inclination toward sin/is, /personally express|personal transgression/is, /not.*immortal life|sin ends in death/is] },
  { reference: "Ephesians 2:5", patterns: [/grace awakens|grace.*enables/is, /bodily resurrection/is, /continuing faith|continuing unbelief/is] },
  { reference: "Ephesians 2:8", patterns: [/gift of God/is, /faith.*not.*merit|not a meritorious/is, /offered, resisted, neglected, or received/is] },
  { reference: "Ephesians 2:9", patterns: [/not of works|works.*not.*(?:source|cause)|cannot.*earn/is, /judgment[^.!?]{0,180}(?:fruit|reveal)/is] },
  { reference: "Ephesians 2:10", patterns: [/created.*good works/is, /do not purchase salvation/is, /Spirit-enabled obedience/is] },
  { reference: "Ephesians 2:15", patterns: [/ceremonial|boundary-marking/is, /clean-and-unclean distinction predates Sinai/is, /moral law.*not abolished|does not teach.*moral law.*abolished/is, /seventh-day Sabbath/is] },
  { reference: "Ephesians 2:18", patterns: [/once for all/is, /heavenly sanctuary/is, /Mediator|intercedes/is] },
  { reference: "Ephesians 2:20", patterns: [/apostolic Scriptures|preserved.*Scripture/is, /new revelation.*(?:not|cannot)|does not.*new revelation/is, /Christ.*corner stone|Jesus Christ.*corner/is] },
  { reference: "Ephesians 2:22", patterns: [/does not.*denial.*heavenly sanctuary|real heavenly sanctuary/is, /Christ.*true sanctuary|Christ.*minister/is] },
  { reference: "Ephesians 3:6", patterns: [/equal heirs|fellowheirs/is, /clean and unclean animals/is, /cannot earn salvation|not a means of purchasing/is] },
  { reference: "Ephesians 3:9", patterns: [/Son is not a creature/is, /All things came into being through Him/is, /divine Creator/is] },
  { reference: "Ephesians 3:15", patterns: [/does not teach.*every creature.*saving sonship/is, /(?:does not|Nor does).*require.*deceased human beings.*consciously/is, /resurrection hope/is] },
  { reference: "Ephesians 3:16", patterns: [/not.*naturally immortal soul/is, /resurrection of the whole person/is, /Holy Spirit/is] },
  { reference: "Ephesians 3:19", patterns: [/does not mean.*God.s essence|Creator-creature distinction/is, /Christ alone.*fullness of deity/is, /when Christ returns|resurrection/is] },
  { reference: "Ephesians 4:4", patterns: [/resurrection of the dead/is, /not.*innately immortal|immortality.*gift/is] },
  { reference: "Ephesians 4:5", patterns: [/Baptism by water|water/is, /does not mechanically regenerate/is, /repentance, faith/is] },
  { reference: "Ephesians 4:6", patterns: [/not.*universal salvation/is, /Access to the Father comes through the Son/is, /Creator and creature/is] },
  { reference: "Ephesians 4:8", patterns: [/need not.*conscious souls|not.*conscious souls/is, /victory|triumph/is] },
  { reference: "Ephesians 4:9", patterns: [/genuinely died|truly.*died/is, /not.*immortal spirit/is, /not require.*conscious dead souls|limbo/is, /resurrection/is] },
  { reference: "Ephesians 4:11", patterns: [/prophetic witness/is, /tested by Scripture/is, /never.*supersede.*canon|not.*supersede.*canon/is] },
  { reference: "Ephesians 4:13", patterns: [/not.*perfectionism|should not be turned into perfectionism/is, /resurrection|Christ.s appearing/is, /dependent upon grace|need of mercy/is] },
  { reference: "Ephesians 4:18", patterns: [/not.*naturally indestructible life|do not carry.*independent/is, /Eternal life is God.s gift/is] },
  { reference: "Ephesians 4:24", patterns: [/moral law/is, /cannot justify|not.*price of acceptance/is, /Spirit/is] },
  { reference: "Ephesians 4:30", patterns: [/not an impersonal energy|personal divine presence/is, /does not.*apostasy impossible|apostasy impossible/is, /dead in Him will be raised|resurrection/is] },
  { reference: "Ephesians 5:2", patterns: [/once for all/is, /no repetition|requires no repetition/is, /Father and the Son|united saving purpose/is] },
  { reference: "Ephesians 5:3", patterns: [/created humanity male and female/is, /marriage/is, /sexual relations outside the marriage covenant|sexuality separated from covenant/is] },
  { reference: "Ephesians 5:5", patterns: [/resurrection/is, /not the natural possession.*indestructible soul|not.*indestructible soul/is, /works do not purchase/is] },
  { reference: "Ephesians 5:6", patterns: [/second death/is, /final destruction of evil/is, /not the endless preservation|not.*endless/is] },
  { reference: "Ephesians 5:16", patterns: [/Sabbath communion with God/is, /Christ.s coming/is] },
  { reference: "Ephesians 5:18", patterns: [/abstinence from alcoholic beverages/is, /tobacco/is, /drugs or narcotics/is, /self-control/is] },
  { reference: "Ephesians 5:21", patterns: [/no person may require another to sin/is, /conceal abuse/is, /moral boundary|sets.*boundary/is] },
  { reference: "Ephesians 5:22", patterns: [/not.*all women.*all men|no basis.*all women/is, /requires refusal|submission to Christ requires refusal/is, /violence|abuse|danger/is] },
  { reference: "Ephesians 5:23", patterns: [/husband cannot.*(?:redeem|cleanse|grant eternal life)|cannot cleanse guilt/is, /Coercion|violence|abusive/is, /Christ.*Saviour/is] },
  { reference: "Ephesians 5:25", patterns: [/no command to make wives submit/is, /domination|violence|sexual coercion/is, /sacrifice remains unique/is] },
  { reference: "Ephesians 5:26", patterns: [/water operates automatically|water.*not.*automatically|does not.*water.*automatically/is, /once for all/is, /continuing heavenly ministry/is] },
  { reference: "Ephesians 5:27", patterns: [/Christ.*completes|raises His people/is, /Judgment/is, /need not.*terror|not.*terror/is] },
  { reference: "Ephesians 5:31", patterns: [/man and woman/is, /exclusive covenant/is, /violence|covenant-breaking/is] },
  { reference: "Ephesians 6:1", patterns: [/No child is required.*sin/is, /conceal abuse/is, /God.s revealed will/is] },
  { reference: "Ephesians 6:2", patterns: [/fifth commandment/is, /moral instruction.*Sinai.*continues|continues to speak authoritatively/is, /not.*earn justification/is] },
  { reference: "Ephesians 6:3", patterns: [/not a mechanical guarantee/is, /resurrection life/is, /Christ.s return/is] },
  { reference: "Ephesians 6:4", patterns: [/does not authorize cruelty|Neither term authorizes cruelty/is, /injures a child|terrorizes/is, /Spirit alone creates new life/is] },
  { reference: "Ephesians 6:5", patterns: [/slaves|enslaved/is, /neither form is made righteous|not.*good institution/is, /seeking freedom|receive freedom/is] },
  { reference: "Ephesians 6:8", patterns: [/final judgment/is, /not.*purchase eternal life|cannot.*purchase eternal life/is, /resurrection|raises the dead/is] },
  { reference: "Ephesians 6:9", patterns: [/relinquish|giving up threatening/is, /cannot.*defend slavery|neither.*defend slavery/is, /impartial Lord|no social partiality/is] },
  { reference: "Ephesians 6:12", patterns: [/not against flesh and blood/is, /great(?:er)? controversy|larger controversy/is, /final end|judgment.*evil/is] },
  { reference: "Ephesians 6:17", patterns: [/not directed against flesh and blood|never directed against/is, /not.*incantation/is, /not.*physical force|physical force/is] },
  { reference: "Ephesians 6:18", patterns: [/does not require.*particular.*gift|not measured.*particular gift/is, /Christ.*return|approaching fulfilment/is] },
  { reference: "Ephesians 6:24", patterns: [/no support.*natural immortality|not.*natural immortality/is, /bestowed by God at the resurrection/is, /mortal puts on immortality/is] }
];

for (const { reference, patterns } of assertions) {
  const commentary = commentaryFor(reference, chapters);
  for (const pattern of patterns) {
    if (!pattern.test(commentary)) errors.push(`${reference}: missing theological safeguard ${pattern}`);
  }
}

if (reviewed !== 155) errors.push(`Expected 155 verified verse notes, found ${reviewed}`);

if (errors.length) {
  console.error(`Ephesians theological validation failed with ${errors.length} error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Ephesians theological validation passed: ${reviewed} reviewed verse notes, `
  + `${assertions.length} passage-specific doctrinal controls, and no private-process or wrong-book leakage.`
);
