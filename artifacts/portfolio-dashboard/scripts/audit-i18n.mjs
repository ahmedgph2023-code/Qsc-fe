import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const en = JSON.parse(fs.readFileSync(path.join(root, "src/i18n/locales/en.json"), "utf8"));
const ar = JSON.parse(fs.readFileSync(path.join(root, "src/i18n/locales/ar.json"), "utf8"));

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, p));
    else out[p] = v;
  }
  return out;
}

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (["node_modules", "dist", ".git"].includes(f.name)) continue;
      walk(p, acc);
    } else if (/\.(tsx|ts)$/.test(f.name)) acc.push(p);
  }
  return acc;
}

const ef = flatten(en);
const af = flatten(ar);
const ek = Object.keys(ef);
const ak = Object.keys(af);

const missingAr = ek.filter((k) => !(k in af));
const extraAr = ak.filter((k) => !(k in ef));

const files = walk(path.join(root, "src"));
const usedKeys = new Set();
const keyRe = /\bt\(\s*['"]([^'"]+)['"]/g;
const noT = [];
const withT = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  let m;
  let n = 0;
  const re = new RegExp(keyRe.source, "g");
  while ((m = re.exec(text))) {
    usedKeys.add(m[1]);
    n++;
  }
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (n) withT.push(rel);
  else if (/\/(pages|components)\//.test(rel) && !rel.includes("/ui/") && !rel.includes("/hooks/")) {
    noT.push(rel);
  }
}

const missingUsed = [...usedKeys].filter((k) => !(k in ef));
const unused = ek.filter((k) => !usedKeys.has(k));

// Heuristic: JSX text nodes / quoted UI strings that look English in pages
const hardSamples = [];
const hardRe =
  />([A-Z][A-Za-z][^<{]{2,80})</g;
const attrRe =
  /(placeholder|title|aria-label|alt)=["']([A-Za-z][^"']{2,80})["']/g;
const toastRe = /(toast\.(success|error|info|warning)|alert)\(\s*["']([^"']+)["']/g;

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, "/");
  if (!/\/(pages|components\/(layout|phase1|brand))\//.test(rel)) continue;
  if (rel.includes("/ui/")) continue;
  const text = fs.readFileSync(file, "utf8");
  let m;
  const r1 = new RegExp(hardRe.source, "g");
  while ((m = r1.exec(text))) {
    const s = m[1].trim();
    if (/^[\d$€£%.,\s\-–—]+$/.test(s)) continue;
    if (/^(QAR|QERI|DSM|IPS|ADTV|NAV|TRI|OMS|AST|EN|AR)\b/.test(s)) continue;
    hardSamples.push({ file: rel, kind: "jsx", text: s.slice(0, 100) });
  }
  const r2 = new RegExp(attrRe.source, "g");
  while ((m = r2.exec(text))) {
    hardSamples.push({ file: rel, kind: m[1], text: m[2].slice(0, 100) });
  }
  const r3 = new RegExp(toastRe.source, "g");
  while ((m = r3.exec(text))) {
    hardSamples.push({ file: rel, kind: "toast", text: m[3].slice(0, 100) });
  }
}

const byFile = {};
for (const h of hardSamples) {
  byFile[h.file] = (byFile[h.file] || 0) + 1;
}

console.log(JSON.stringify({
  keyCounts: { en: ek.length, ar: ak.length },
  missingInAr: missingAr,
  extraInAr: extraAr,
  usedKeys: usedKeys.size,
  unusedKeysCount: unused.length,
  unusedSample: unused.slice(0, 40),
  tKeysMissingFromEn: missingUsed,
  filesWithT: withT.length,
  filesWithoutT: noT,
  hardCodedByFile: Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 40),
  hardCodedSample: hardSamples.slice(0, 80),
}, null, 2));
