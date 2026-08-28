import fs from "fs";
import path from "path";

const pagesDir = path.join("src", "pages");
const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"));

for (const file of files) {
  const p = path.join(pagesDir, file);
  let s = fs.readFileSync(p, "utf8");
  if (!s.includes("useTranslation")) continue;

  // Remove all injected hooks
  const cleaned = s.replace(/\n  const \{ t \} = useTranslation\(\);/g, "");
  // Split by function boundaries roughly and re-add where t( is used
  // Safer: find each "function Name(...) {" and if body until next top-level function uses t(, inject hook once
  const parts = [];
  const re = /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{|function\s+\w+\s*\([^)]*\)\s*\{)/g;
  let last = 0;
  let m;
  const matches = [];
  while ((m = re.exec(cleaned)) !== null) {
    matches.push({ index: m.index, text: m[0] });
  }
  if (matches.length === 0) {
    fs.writeFileSync(p, cleaned);
    continue;
  }
  let out = cleaned.slice(0, matches[0].index);
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : cleaned.length;
    let chunk = cleaned.slice(start, end);
    const usesT = /\bt\(/.test(chunk);
    const hasHook = /const \{ t \} = useTranslation/.test(chunk);
    if (usesT && !hasHook) {
      chunk = chunk.replace(matches[i].text, `${matches[i].text}\n  const { t } = useTranslation();`);
    }
    out += chunk;
  }
  if (out !== s) {
    fs.writeFileSync(p, out);
    console.log("cleaned", file);
  }
}
console.log("done");
