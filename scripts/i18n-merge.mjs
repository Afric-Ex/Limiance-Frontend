import fs from "node:fs";

const locales = ["en", "fr", "da", "de", "es"];
const report = [];

for (const loc of locales) {
  const basePath = `messages/${loc}.json`;
  const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const dir = `messages/parts/${loc}`;
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  for (const file of files) {
    const part = JSON.parse(fs.readFileSync(`${dir}/${file}`, "utf8"));
    for (const ns of Object.keys(part)) {
      base[ns] ||= {};
      let added = 0;
      let replaced = 0;
      for (const key of Object.keys(part[ns])) {
        if (!(key in base[ns])) {
          base[ns][key] = part[ns][key];
          added++;
        } else if (base[ns][key] !== part[ns][key]) {
          replaced++;
        }
      }
      report.push(`${loc} ${ns}: +${added} ~${replaced}`);
    }
  }
  fs.writeFileSync(basePath, JSON.stringify(base, null, 2) + "\n");
}

console.log(report.join("\n"));

const reference = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const keySet = (obj) => {
  const out = new Set();
  for (const ns of Object.keys(obj)) {
    for (const key of Object.keys(obj[ns])) out.add(`${ns}.${key}`);
  }
  return out;
};
const enKeys = keySet(reference);
let drift = 0;
for (const loc of locales.filter((l) => l !== "en")) {
  const keys = keySet(JSON.parse(fs.readFileSync(`messages/${loc}.json`, "utf8")));
  const missing = [...enKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !enKeys.has(k));
  if (missing.length || extra.length) {
    drift++;
    console.log(`\n${loc}: missing ${missing.length}, extra ${extra.length}`);
    for (const k of missing.slice(0, 20)) console.log(`  missing ${k}`);
    for (const k of extra.slice(0, 20)) console.log(`  extra   ${k}`);
  }
}
if (!drift) console.log("\nAll locales in sync with en.");
