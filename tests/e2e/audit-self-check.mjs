import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findViolations, runAudit } from "../../scripts/audit-pii.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * The audit is the release gate for this migration, so a pattern that silently
 * stopped matching would be worse than no gate at all. These cases pin both
 * directions: every prohibited shape must be caught, and every shape the
 * migrated code legitimately uses must stay quiet.
 */
const CASES = [
  ["token in WebSocket URL", 'const u = ws + "?auth-token=" + token;', true],
  ["Authorization header in defaults", 'headers: { Authorization: "Bearer t" },', true],
  ["Authorization via setRequestHeader", 'xhr.setRequestHeader("Authorization", v);', true],
  ["bearer credential literal", "h[`X`] = `Bearer ${tok}`;", true],
  ["session cookie read from script", "const c = document.cookie.match(/auth-token=(.*)/);", true],
  ["credential persisted to storage", 'localStorage.setItem("user-access-token", v)', true],
  ["legacy verify-token in storage", 'sessionStorage.setItem("verify-token", v)', true],
  ["cookies-next imported", 'import { getCookie } from "cookies-next/server";', true],
  [
    "browser client on the backend origin",
    "const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });",
    true,
  ],

  ["proxy baseURL", "const api = axios.create({ baseURL: PROXY_PREFIX });", false],
  ["same-origin ws url", "return `${scheme}://${window.location.host}/ws-proxy`;", false],
  ["memory-only kyc provider token", "data: { accessToken?: string; inquiryId?: string };", false],
  ["pii-policy cookie comment", "// Deliberately does NOT touch `document.cookie`.", false],
  ["commented-out header", "// headers: { Authorization: x }", false],
  ["docstring about cookies", " * The session cookie is HttpOnly, so script can neither read nor clear it.", false],
];

let failures = 0;

for (const [name, line, shouldMatch] of CASES) {
  const matched = findViolations(line);
  if (shouldMatch && matched.length === 0) {
    failures += 1;
    console.error(`✗ ${name}: expected a finding, got none`);
  } else if (!shouldMatch && matched.length > 0) {
    failures += 1;
    console.error(`✗ ${name}: false positive -> ${matched.join(", ")}`);
  }
}

// The repository itself must stay clean.
const findings = runAudit();
if (findings.length) {
  failures += 1;
  findings.forEach((finding) => console.error(`✗ repository finding: ${finding}`));
}

console.log(`Limiance PII audit self-check (${CASES.length} patterns, ${findings.length} repo findings)`);
if (failures) {
  console.error(`✗ ${failures} failure(s)`);
  process.exitCode = 1;
} else {
  console.log("✓ Audit patterns fire on prohibited shapes and stay quiet elsewhere.");
}