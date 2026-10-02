import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["src", "app", "middleware.ts", "next.config.ts"];
const SKIP = new Set(["node_modules", ".next", ".git", ".scratch"]);
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs)$/;

function filesIn(target, output = []) {
  const absolute = path.join(ROOT, target);
  if (!fs.existsSync(absolute)) return output;
  const stat = fs.statSync(absolute);
  if (stat.isFile()) {
    output.push(absolute);
    return output;
  }
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(absolute, entry.name);
    if (entry.isDirectory()) filesIn(path.join(target, entry.name), output);
    else if (EXTENSIONS.test(entry.name)) output.push(full);
  }
  return output;
}

const checks = [
  ["raw auth token in a WebSocket URL", /[?&]auth-token=\$\{|auth-token=\$\{token\}/i],
  ["auth token written to localStorage", /localStorage\.setItem\(\s*["'`]auth-token/i],
  ["verification token written to browser storage", /(?:localStorage|sessionStorage)\.setItem\(\s*["'`]verify-token/i],
  ["P2P identity data written to localStorage", /localStorage\.setItem\(\s*["'`]p2p-(?:blocked|reported|advertiser)/i],
  ["auth token written to a JavaScript-readable cookie", /document\.cookie\s*=.*auth-token=\$\{/i],
];

const findings = [];
for (const file of SCAN_DIRS.flatMap((entry) => filesIn(entry))) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const [label, pattern] of checks) {
      if (pattern.test(line)) findings.push(`${path.relative(ROOT, file).replaceAll("\\", "/")}:${index + 1} ${label}`);
    }
  });
}

console.log("Limiance PII boundary audit");
if (findings.length) {
  console.error(`✗ ${findings.length} blocking finding(s)`);
  findings.forEach((finding) => console.error(`  - ${finding}`));
  console.error("Release is blocked until every finding is removed or explicitly approved.");
  process.exitCode = 1;
} else {
  console.log("✓ No prohibited PII or credential writes found.");
}
