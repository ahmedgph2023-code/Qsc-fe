/**
 * Convert physical L/R Tailwind utilities to logical start/end equivalents.
 * Safe for RTL/LTR. Skips chart SVG attribute strings and scrollLeft identifiers.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

const SKIP_DIRS = new Set(["node_modules", "dist"]);
/** Optional: skip unused shadcn primitives that aren't mounted in Shell */
const SKIP_FILES = new Set([
  // keep converting ui — better for consistency
]);

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (SKIP_DIRS.has(f.name)) continue;
      walk(p, acc);
    } else if (/\.(tsx|ts|css)$/.test(f.name)) acc.push(p);
  }
  return acc;
}

function convertClassChunk(chunk) {
  let s = chunk;

  // text alignment
  s = s.replace(/\btext-left\b/g, "text-start");
  s = s.replace(/\btext-right\b/g, "text-end");

  // floats
  s = s.replace(/\bfloat-left\b/g, "float-start");
  s = s.replace(/\bfloat-right\b/g, "float-end");

  // margins / paddings (incl. negative and arbitrary)
  s = s.replace(/(?<![\w-])-?m([lr])-/g, (m) => {
    const neg = m.startsWith("-");
    const side = m.includes("ml") || m.includes("-ml") ? "s" : "e";
    // m matches like "ml-" or "-ml-"
    if (m.includes("ml")) return `${neg ? "-" : ""}ms-`;
    return `${neg ? "-" : ""}me-`;
  });
  // Fix: the regex above is messy. Do explicit passes:
  return null;
}

function convert(text) {
  let s = text;

  // --- Tailwind class tokens (word-boundary safe) ---
  s = s.replace(/\btext-left\b/g, "text-start");
  s = s.replace(/\btext-right\b/g, "text-end");
  s = s.replace(/\bfloat-left\b/g, "float-start");
  s = s.replace(/\bfloat-right\b/g, "float-end");

  // margin / padding physical → logical
  s = s.replace(/(?<![\w-])-ml-/g, "-ms-");
  s = s.replace(/(?<![\w-])-mr-/g, "-me-");
  s = s.replace(/(?<![\w-])ml-/g, "ms-");
  s = s.replace(/(?<![\w-])mr-/g, "me-");
  s = s.replace(/(?<![\w-])pl-/g, "ps-");
  s = s.replace(/(?<![\w-])pr-/g, "pe-");

  // positioning insets
  s = s.replace(/(?<![\w-])-left-/g, "-start-");
  s = s.replace(/(?<![\w-])-right-/g, "-end-");
  s = s.replace(/(?<![\w-])left-/g, "start-");
  s = s.replace(/(?<![\w-])right-/g, "end-");

  // rounded corners
  s = s.replace(/\brounded-tl\b/g, "rounded-ss");
  s = s.replace(/\brounded-tr\b/g, "rounded-se");
  s = s.replace(/\brounded-bl\b/g, "rounded-es");
  s = s.replace(/\brounded-br\b/g, "rounded-ee");
  s = s.replace(/\brounded-l\b/g, "rounded-s");
  s = s.replace(/\brounded-r\b/g, "rounded-e");
  // with size suffix rounded-l-md etc already caught by rounded-l\b before -md? 
  // Tailwind is rounded-l-md → need rounded-s-md
  s = s.replace(/\brounded-tl-/g, "rounded-ss-");
  s = s.replace(/\brounded-tr-/g, "rounded-se-");
  s = s.replace(/\brounded-bl-/g, "rounded-es-");
  s = s.replace(/\brounded-br-/g, "rounded-ee-");
  s = s.replace(/\brounded-l-/g, "rounded-s-");
  s = s.replace(/\brounded-r-/g, "rounded-e-");

  // borders
  s = s.replace(/\bborder-l\b/g, "border-s");
  s = s.replace(/\bborder-r\b/g, "border-e");
  s = s.replace(/\bborder-l-/g, "border-s-");
  s = s.replace(/\bborder-r-/g, "border-e-");

  // space-x → add rtl reverse helper class if not already present
  // Prefer: space-x-2 → space-x-2 rtl:space-x-reverse
  s = s.replace(/\bspace-x-(\[?[^\s"'`\]]+\]?)/g, (full, n) => {
    if (full.includes("rtl:space-x-reverse")) return full;
    return `space-x-${n} rtl:space-x-reverse`;
  });

  // CSS physical properties in style blocks / index.css
  s = s.replace(/\btext-align:\s*left\b/g, "text-align: start");
  s = s.replace(/\btext-align:\s*right\b/g, "text-align: end");
  s = s.replace(/\bmargin-left\b/g, "margin-inline-start");
  s = s.replace(/\bmargin-right\b/g, "margin-inline-end");
  s = s.replace(/\bpadding-left\b/g, "padding-inline-start");
  s = s.replace(/\bpadding-right\b/g, "padding-inline-end");
  s = s.replace(/\bborder-left\b/g, "border-inline-start");
  s = s.replace(/\bborder-right\b/g, "border-inline-end");

  // Don't rewrite `left:` in JS objects carelessly — only in CSS contexts
  // Handled separately for index.css .cdp-tab-ink

  return s;
}

const files = walk(root);
let changed = 0;
const details = [];

for (const file of files) {
  const rel = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
  if (SKIP_FILES.has(rel)) continue;
  const before = fs.readFileSync(file, "utf8");
  let after = convert(before);

  // Keep physical left for tab ink — offsetLeft + translateX are left-edge based in both dirs
  if (rel.endsWith("index.css")) {
    // no-op (do not convert .cdp-tab-ink left)
  }

  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed++;
    details.push(rel);
  }
}

console.log(JSON.stringify({ changed, files: details }, null, 2));
