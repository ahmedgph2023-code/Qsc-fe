import fs from "fs";
import path from "path";

const pagesDir = path.join("src", "pages");
const pages = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"));

const replacements = [
  ['title="Clients"', 'title={t("customers.title")}'],
  ['description="Managed investor accounts with mandate status and portfolio value."', 'description={t("customers.description")}'],
  ['title="Market Stocks"', 'title={t("stocks.title")}'],
  ['title="Benchmark Indices"', 'title={t("indices.title")}'],
  ['title="Sector Intelligence"', 'title={t("sectors.title")}'],
  ['title="Portfolio Builder"', 'title={t("builder.title")}'],
  ['title="Rebalances"', 'title={t("rebalances.title")}'],
  ['title="Fees & commissions"', 'title={t("fees.title")}'],
  ['title="Compliance Control"', 'title={t("compliance.title")}'],
  ['title="Risk Monitor"', 'title={t("risk.title")}'],
  ['title="Audit Trail"', 'title={t("audit.title")}'],
  ['title="Fixed Income"', 'title={t("fixedIncome.title")}'],
  ['title="Users"', 'title={t("usersAdmin.title")}'],
  ['title="System Config"', 'title={t("systemConfig.title")}'],
  ['title="Trade Simulator"', 'title={t("tradeSimulator.title")}'],
  ['title="Orders (OMS)"', 'title={t("orders.title")}'],
  ['title="QSC sheet import"', 'title={t("historicalImport.title")}'],
  ['title="Reports"', 'title={t("phase2.reportsTitle")}'],
  ['title="Reconciliation"', 'title={t("phase2.reconTitle")}'],
  ['title="Market Overview"', 'title={t("phase3.marketsTitle")}'],
  ['title="Stock Screener"', 'title={t("phase3.screenerTitle")}'],
  ['title="Approved List"', 'title={t("phase3.approvedTitle")}'],
  ['title="AI Assistant"', 'title={t("phase4.aiTitle")}'],
  ['title="Automated Commentary"', 'title={t("phase4.commentaryTitle")}'],
  ['title="Scenario Analysis"', 'title={t("phase4.scenariosTitle")}'],
  ['title="Efficient Frontier"', 'title={t("phase4.frontierTitle")}'],
  ['title="Command Center"', 'title={t("dashboard.title")}'],
  ['title="Ops forms (F-01–F-06)"', 'title={t("phase2.opsTitle")}'],
  ['title="Company Analysis"', 'title={t("phase3.companyTitle")}'],
  ['title="Sharia & ESG"', 'title={t("phase3.shariaTitle")}'],
  ['title="Investment Strategy"', 'title={t("phase3.strategiesTitle")}'],
  ['title="Stock Scoring"', 'title={t("phase3.scoringTitle")}'],
];

function ensureImportAndHook(source) {
  let s = source;
  if (!s.includes("react-i18next")) {
    if (s.includes('from "react"')) {
      s = s.replace('from "react";', 'from "react";\nimport { useTranslation } from "react-i18next";');
    } else if (s.includes("from 'react'")) {
      s = s.replace("from 'react';", "from 'react';\nimport { useTranslation } from 'react-i18next';");
    } else {
      s = 'import { useTranslation } from "react-i18next";\n' + s;
    }
  }
  if (!/const\s*\{\s*t\s*\}\s*=\s*useTranslation/.test(s)) {
    s = s.replace(
      /((?:export\s+default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)/g,
      "$1\n  const { t } = useTranslation();",
    );
  }
  return s;
}

let touched = 0;
for (const file of pages) {
  const p = path.join(pagesDir, file);
  let s = fs.readFileSync(p, "utf8");
  const orig = s;
  for (const [from, to] of replacements) {
    if (s.includes(from)) s = s.split(from).join(to);
  }
  if (s !== orig) {
    s = ensureImportAndHook(s);
    fs.writeFileSync(p, s);
    touched += 1;
    console.log("patched", file);
  }
}
console.log("touched", touched);
