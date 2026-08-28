import fs from "fs";
import path from "path";

const root = path.resolve("src");
const files = [
  "pages/IndexDetail.tsx",
  "pages/StockDetail.tsx",
  "pages/SectorDetail.tsx",
  "pages/not-found.tsx",
  "pages/Audit.tsx",
  "pages/FixedIncomeLot.tsx",
  "pages/RebalanceDetail.tsx",
  "components/IndexConstituentsDialog.tsx",
  "components/ui/pagination.tsx",
  "components/ui/dropdown-menu.tsx",
  "components/ui/context-menu.tsx",
  "components/ui/menubar.tsx",
  "components/ui/breadcrumb.tsx",
  "components/ui/calendar.tsx",
  "components/ui/carousel.tsx",
];

const iconRe =
  /<(ChevronLeft|ChevronRight|ChevronsLeft|ChevronsRight|ArrowLeft|ArrowRight|ChevronLeftIcon|ChevronRightIcon)(\s+className="([^"]*)")?/g;

let n = 0;
for (const rel of files) {
  const f = path.join(root, rel);
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s;
  s = s.replace(iconRe, (m, icon, _cls, classes = "") => {
    if (String(classes).includes("rtl:rotate-180")) return m;
    if (!classes) return `<${icon} className="rtl:rotate-180"`;
    return `<${icon} className="${classes} rtl:rotate-180"`;
  });
  // cn() forms: className={cn("h-4 w-4", className)} for calendar chevrons
  s = s.replace(
    /return <(ChevronLeftIcon|ChevronRightIcon) className=\{cn\("size-4", className\)\}/g,
    'return <$1 className={cn("size-4 rtl:rotate-180", className)}',
  );
  if (s !== before) {
    fs.writeFileSync(f, s);
    console.log("updated", rel);
    n++;
  } else {
    console.log("unchanged", rel);
  }
}
console.log("files updated:", n);
