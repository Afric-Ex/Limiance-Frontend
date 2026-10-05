import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
  ["raw auth token in a WebSocket URL", /[?&](?:limiance_session|auth-token)=\$\{|(?:limiance_session|auth-token)=\$\{token\}/i],
  ["auth token written to localStorage", /localStorage\.setItem\(\s*["'`]auth-token/i],
  ["verification token written to browser storage", /(?:localStorage|sessionStorage)\.setItem\(\s*["'`]verify-token/i],
  ["P2P identity data written to localStorage", /localStorage\.setItem\(\s*["'`]p2p-(?:blocked|reported|advertiser)/i],
  ["auth token written to a JavaScript-readable cookie", /document\.cookie\s*=.*(?:limiance_session|auth-token)=\$\{/i],
  ["credential appended to a URL", /[?&](?:limiance_session|access_token|refresh_token|auth_token|auth-token|session[_-]?token|jwt)=/i],
  ["Authorization header set by app code", /(?:headers\s*:\s*\{[^}]*Authorization|setRequestHeader\(\s*["'`]Authorization)["'`]?\s*[:,)]/i],
  ["bearer credential literal", /["'`]Bearer\s+\$\{/i],
  ["session cookie read from JavaScript", /document\.cookie\b[^;\n]{0,60}(?:limiance_session|auth-token|auth_token|session)/i],
  ["credential persisted to browser storage", /(?:localStorage|sessionStorage)\.setItem\(\s*["'`][^"'`]*(?:token|password|secret|credential|jwt)/i],
  ["cookies-next client auth helper imported", /from\s+["']cookies-next(?:\/[^"']*)?["']/i],
  ["browser API client pointed at the backend origin", /baseURL\s*:\s*(?:process\.env\.NEXT_PUBLIC_API_URL|`\$\{[^}]*NEXT_PUBLIC_API_URL)/i],
];

/** Exported so the self-check can prove each pattern fires and each stays quiet. */
export const auditPatterns = checks;

/** Comment lines describe the rules; they must not be scanned for violations. */
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;

/** Violations on a single source line, ignoring comments. */
export const findViolations = (line) => {
  if (COMMENT_LINE.test(line)) return [];
  const hits = [];
  for (const [label, pattern] of checks) {
    if (pattern.test(line)) hits.push(label);
  }
  return hits;
};

export const runAudit = () => {
  const findings = [];
  for (const file of SCAN_DIRS.flatMap((entry) => filesIn(entry))) {
    const relative = path.relative(ROOT, file).replaceAll("\\", "/");
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, index) => {
        for (const label of findViolations(line)) {
          findings.push(`${relative}:${index + 1} ${label}`);
        }
      });
  }
  return findings;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = runAudit();
  console.log("Limiance PII boundary audit");
  if (findings.length) {
    console.error(`✗ ${findings.length} blocking finding(s)`);
    findings.forEach((finding) => console.error(`  - ${finding}`));
    console.error("Release is blocked until every finding is removed or explicitly approved.");
    process.exitCode = 1;
  } else {
    console.log("✓ No prohibited PII or credential writes found.");
  }
}
