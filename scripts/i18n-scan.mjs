import fs from "node:fs";
import { execSync } from "node:child_process";

const arg = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = arg.length
  ? arg
  : execSync('git diff --name-only -- "*.tsx" "*.ts"', { encoding: "utf8" })
      .split(/\r?\n/)
      .filter((f) => f && fs.existsSync(f));

const ATTRS =
  "placeholder|title|label|aria-label|alt|toast|message|description|text|hint|tooltip|emptyText|content|heading|subtitle|buttonText|confirmText|cancelText|successMessage|errorMessage";
const counts = {};

for (const file of targets) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  const hits = [];
  lines.forEach((line, index) => {
    if (/useTranslations|getTranslations|^\s*import |^\s*\/\//.test(line)) return;
    if (/\bt\(|\{\s*t\./.test(line) && !/"[A-Z][a-z]/.test(line.replace(/t\([^)]*\)/g, ""))) {
      // still scan, translated lines may contain other literals
    }
    const push = (value) => {
      const v = value.trim();
      if (v.length < 3) return;
      if (!/[a-z]/.test(v)) return;
      if (/^(https?:|\/|#|\.)/.test(v)) return;
      if (/^[a-z0-9-_:/.[\]{}]+$/.test(v)) return;
      hits.push(`${index + 1}: ${v}`);
    };
    for (const m of line.matchAll(
      new RegExp(`(?:${ATTRS})\\s*=\\s*"([^"]{3,})"`, "g"),
    )) {
      if (/^[A-Za-z][A-Za-z0-9 ,.'’!?%:/\-()&+]*$/.test(m[1])) push(m[1]);
    }
    for (const m of line.matchAll(/>\s*([A-Z][A-Za-z][A-Za-z0-9 ,.'’!?%:/\-()&]{2,})\s*</g)) {
      push(m[1]);
    }
  });
  if (hits.length) {
    counts[file] = hits.length;
    console.log(`### ${file} (${hits.length})`);
    for (const h of hits) console.log("  " + h);
  }
}

console.log("\nFILES WITH CANDIDATES:");
for (const [f, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${n}\t${f}`);
}
console.log(
  "TOTAL CANDIDATES:",
  Object.values(counts).reduce((a, b) => a + b, 0),
);
