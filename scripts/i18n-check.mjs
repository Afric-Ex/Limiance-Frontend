import fs from "node:fs";
import { execSync } from "node:child_process";

const messages = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const partsByLocale = {};
for (const loc of ["en", "fr", "da", "de", "es"]) {
  const dir = `messages/parts/${loc}`;
  const merged = {};
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      const part = JSON.parse(fs.readFileSync(`${dir}/${file}`, "utf8"));
      for (const ns of Object.keys(part)) {
        merged[ns] = { ...(merged[ns] || {}), ...part[ns] };
      }
    }
  }
  partsByLocale[loc] = merged;
}

const exists = (ns, key) =>
  (messages[ns] && key in messages[ns]) ||
  (partsByLocale[loc0()] && partsByLocale[loc0()][ns] && key in partsByLocale[loc0()][ns]);

function loc0() {
  return "en";
}

const files = execSync('git ls-files "*.tsx" "*.ts"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f && fs.existsSync(f) && (f.startsWith("src/") || f.startsWith("app/")));

const missing = {};
const dynamic = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  if (!/(useTranslations|getTranslations)/.test(src)) continue;
  const bindings = {};
  for (const m of src.matchAll(
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*"([^"]+)"\s*\)/g,
  )) {
    bindings[m[1]] = m[2];
  }
  for (const [varName, ns] of Object.entries(bindings)) {
    const re = new RegExp(`\\b${varName}\\.?(?:rich|raw|markup)?\\(\\s*"([^"]+)"`, "g");
    for (const m of src.matchAll(re)) {
      if (!exists(ns, m[1])) {
        (missing[file] ||= new Set()).add(`${ns}::${m[1]}`);
      }
    }
    const reTpl = new RegExp(`\\b${varName}\\.?(?:rich|raw|markup)?\\(\\s*\``);
    if (reTpl.test(src)) dynamic.push(`${file} [${ns}] template-literal key`);
  }
}

let total = 0;
const lines = [];
for (const [file, set] of Object.entries(missing).sort()) {
  lines.push(`### ${file}`);
  for (const key of [...set].sort()) {
    lines.push(`  ${key}`);
    total++;
  }
}
lines.push(`TOTAL MISSING: ${total}`);
if (dynamic.length) {
  lines.push("DYNAMIC KEYS (verify manually):");
  for (const d of dynamic) lines.push(`  ${d}`);
}
console.log(lines.join("\n"));

if (process.argv.includes("--namespaces")) {
  const groups = {};
  for (const [file, set] of Object.entries(missing)) {
    for (const key of set) {
      const ns = key.split("::")[0];
      (groups[ns] ||= new Set()).add(file);
    }
  }
  console.log("\nNAMESPACES WITH GAPS:");
  for (const [ns, set] of Object.entries(groups).sort()) {
    console.log(`  ${ns}: ${set.size} files`);
  }
}
