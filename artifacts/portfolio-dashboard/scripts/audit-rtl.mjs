import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src");

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (["node_modules", "dist"].includes(f.name)) continue;
      walk(p, acc);
    } else if (/\.(tsx|ts|css)$/.test(f.name)) acc.push(p);
  }
  return acc;
}

const patterns = {
  "text-left/right": /\btext-(left|right)\b/g,
  "ml/mr/pl/pr": /\b(m|p)(l|r)-(?:\d|auto|px|\[)/g,
  "left-/right- util": /(?<![\w-])(left|right)-(?:\d|auto|full|1\/|\[)/g,
  "rounded-l/r": /\brounded-(l|r|tl|tr|bl|br)(?:-|\[|\b)/g,
  "border-l/r": /\bborder-(l|r)(?:-|\[|\b)/g,
  "space-x without rtl reverse": /\bspace-x-(?!reverse)[^\n"']*"(?![^"]*rtl:space-x-reverse)/g,
  "origin-left/right": /\borigin-(left|right)\b/g,
  "float-left/right": /\bfloat-(left|right)\b/g,
  "css left/right:": /(?<![\w-])(margin|padding|border)-(left|right)\s*:/g,
  "css inset left/right": /(?<![\w-])(left|right)\s*:\s*[^;]+;/g,
  "object-left/right": /\bobject-(left|right)\b/g,
  "dir icon missing rtl rotate": /<(ChevronLeft|ChevronRight|ArrowLeft|ArrowRight|ChevronsLeft|ChevronsRight|PanelLeft\w*)[^>]*(?!rtl:rotate)[^>]*>/g,
};

const files = walk(root);
const report = {};
for (const [name, re] of Object.entries(patterns)) {
  report[name] = { total: 0, files: {} };
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");
    let count = 0;
    if (name === "dir icon missing rtl rotate") {
      // Line-based: icon component open tag without rtl:rotate-180 nearby
      const lines = text.split("\n");
      for (const line of lines) {
        if (
          /(ChevronLeft|ChevronRight|ArrowLeft|ArrowRight|ChevronsLeft|ChevronsRight|PanelLeftOpen|PanelLeftClose)/.test(line) &&
          /className=/.test(line) &&
          !/rtl:rotate-180/.test(line) &&
          !/rotate-90|-rotate-90/.test(line) // vertical carets
        ) {
          count += 1;
        }
      }
    } else if (name === "space-x without rtl reverse") {
      const lines = text.split("\n");
      for (const line of lines) {
        if (/\bspace-x-/.test(line) && !/space-x-reverse/.test(line) && !/rtl:space-x-reverse/.test(line)) {
          count += 1;
        }
      }
    } else {
      const matches = text.match(new RegExp(re.source, re.flags));
      count = matches?.length ?? 0;
    }
    if (count) {
      report[name].total += count;
      report[name].files[rel] = count;
    }
  }
  report[name].top = Object.entries(report[name].files)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  delete report[name].files;
}

console.log(JSON.stringify(report, null, 2));
