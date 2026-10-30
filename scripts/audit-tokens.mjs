import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCAN_DIRS = ["src", "app", "middleware.ts", "next.config.ts", "tailwind.config.ts"];
const SKIP = new Set(["node_modules", ".next", ".git", ".scratch"]);
const EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|css)$/;

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;
const COMMENT_LINE = /^\s*(\/\/|\*|\/\*)/;
const IGNORE_MARKER = "audit-tokens-ignore";

/** Canonical palette from DESIGN_SYSTEM.md §2. */
const CANONICAL_COLORS = [
  "#4d77f0",
  "#4168dd",
  "#162244",
  "#121212",
  "#222222",
  "#292929",
  "#293556",
  "#343434",
  "#000000",
  "#ffffff",
  "#e0e0e0",
  "#727679",
  "#666666",
  "#d9d9d9",
  "#a1a1aa",
  "#e4e4e7",
  "#25ab42",
  "#25ab421a",
  "#27ae60",
  "#f6465d",
  "#ff9500",
  "#fba42a",
  "#181a20",
];

const loadAllowlist = () => {
  const allowlistPath = path.join(ROOT, "scripts", "audit-tokens.allowlist.json");
  if (!fs.existsSync(allowlistPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
    return Array.isArray(parsed.colors) ? parsed.colors : [];
  } catch {
    return [];
  }
};

const allowedColors = new Set([
  ...CANONICAL_COLORS.map((color) => color.toLowerCase()),
  ...loadAllowlist().map((color) => String(color).toLowerCase()),
]);

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

export const findColors = (line) => {
  if (COMMENT_LINE.test(line) || line.includes(IGNORE_MARKER)) return [];
  const matches = line.match(HEX_COLOR);
  if (!matches) return [];
  return [...new Set(matches.map((color) => color.toLowerCase()))].filter(
    (color) => !allowedColors.has(color)
  );
};

export const runAudit = () => {
  const findings = [];
  for (const file of SCAN_DIRS.flatMap((entry) => filesIn(entry))) {
    const relative = path.relative(ROOT, file).replaceAll("\\", "/");
    fs.readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, index) => {
        for (const color of findColors(line)) {
          findings.push(`${relative}:${index + 1} raw color ${color}`);
        }
      });
  }
  return findings;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = runAudit();
  console.log("Limiance design token audit");
  if (findings.length) {
    console.error(`✖ ${findings.length} raw color finding(s)`);
    findings.forEach((finding) => console.error(`  - ${finding}`));
    console.error(
      "Use a semantic token (bg-primary, text-secondary, var(--color-*)) or document an approved exception in scripts/audit-tokens.allowlist.json."
    );
    process.exitCode = 1;
  } else {
    console.log("✔ No unapproved raw colors found.");
  }
}
