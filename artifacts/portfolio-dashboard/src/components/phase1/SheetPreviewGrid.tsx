import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PortfolioFormulaRow, SheetGridPreview, SheetIdentity, SheetIssue } from "@/lib/api";
import { cn } from "@/lib/utils";

function colLetter(index: number) {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

const OPS = ["+", "-", "*", "/", "^", "(", ")"] as const;
const OP_LABEL: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^", "(": "(", ")": ")" };

function parseTokens(expr: string) {
  const src = String(expr || "").replace(/\s+/g, "");
  const out: Array<{ kind: "id" | "num" | "op"; value: string }> = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if ((OPS as readonly string[]).includes(ch)) {
      out.push({ kind: "op", value: ch });
      i += 1;
      continue;
    }
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      let j = i + 1;
      while (j < src.length && ((src[j] >= "0" && src[j] <= "9") || src[j] === ".")) j += 1;
      out.push({ kind: "num", value: src.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j += 1;
      out.push({ kind: "id", value: src.slice(i, j) });
      i = j;
      continue;
    }
    return [];
  }
  return out;
}

export function SheetPreviewGrid({
  title,
  fileName,
  grid,
  parsedCount,
  skippedCount,
  skippedBuySell = 0,
  kind,
}: {
  title: string;
  fileName?: string;
  grid?: SheetGridPreview | null;
  parsedCount: number;
  skippedCount: number;
  skippedBuySell?: number;
  kind?: "trades" | "cash" | "market";
}) {
  const { t } = useTranslation();
  if (!grid || !grid.headers.length) {
    return (
      <div className="rounded-lg border border-[#dfe6f6] bg-white/80 px-3 py-4 text-start text-sm text-muted-foreground">
        {t("historicalImport.noSheetRows")}
      </div>
    );
  }

  const shown = grid.rows.length;
  const settlementSkips = kind === "cash" ? skippedBuySell : 0;

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-[#c5d3c0] bg-white text-start shadow-[0_8px_18px_rgba(33,115,70,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c5d3c0] bg-[#217346] px-3 py-1.5 text-white">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{title}</p>
          {fileName ? <p className="truncate font-mono text-[10px] text-white/80" dir="ltr">{fileName}</p> : null}
        </div>
        <p className="font-mono text-[10px] tracking-wide" dir="ltr">
          {t("historicalImport.gridDims", {
            rows: grid.sheetRowCount,
            cols: grid.sheetColCount,
            shown,
          })}
        </p>
      </div>
      <div className="max-h-[min(22rem,46vh)] overflow-auto bg-[#f3f3f3]" dir="ltr">
        <table className="min-w-max border-collapse text-[11px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky start-0 z-30 min-w-10 border border-[#d0d7cd] bg-[#e2efda] px-1.5 py-1 text-center font-mono text-[9px] text-[#375623]">
                #
              </th>
              {grid.headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="min-w-[5.5rem] max-w-[12rem] border border-[#d0d7cd] bg-[#e2efda] px-2 py-1 text-start font-semibold text-[#375623]"
                  title={header}
                >
                  <span className="me-1 font-mono text-[9px] text-[#6b8f57]">{colLetter(index)}</span>
                  <span className="block truncate">{header}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="odd:bg-white even:bg-[#f8fbf6]"
                style={{ contentVisibility: "auto", containIntrinsicSize: "auto 24px" }}
              >
                <th className="sticky start-0 z-10 border border-[#e4e4e4] bg-[#f2f2f2] px-1.5 py-0.5 text-center font-mono text-[9px] font-normal text-[#888]">
                  {rowIndex + 1}
                </th>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="max-w-[12rem] truncate border border-[#e4e4e4] px-2 py-0.5 font-data text-[#1f1f1f]"
                    title={cell || ""}
                  >
                    {cell || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-0.5 border-t border-[#dfe6f6] bg-[#fafafa] px-3 py-1.5 text-[10px] leading-relaxed text-[#53658c]">
        <p>
          {t("historicalImport.parsedCount", { count: parsedCount })}
          {grid.truncated ? ` · ${t("historicalImport.gridTruncated")}` : null}
        </p>
        {settlementSkips > 0 ? (
          <p>{t("historicalImport.skippedBuySell", { count: settlementSkips })}</p>
        ) : skippedCount > 0 ? (
          <p>{t("historicalImport.skippedOther", { count: skippedCount })}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SheetIssueList({ issues }: { issues: SheetIssue[] }) {
  const { t } = useTranslation();
  if (!issues.length) {
    return (
      <p className="flex items-center gap-1.5 text-start text-sm text-[#217346]">
        <CheckCircle2 className="h-4 w-4" />
        {t("historicalImport.validationOk")}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {issues.map((issue, index) => (
        <li
          key={`${issue.code}-${index}`}
          className={cn(
            "flex items-start gap-1.5 text-start text-xs",
            issue.severity === "error" ? "text-rose-600" : "text-amber-700",
          )}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t(`historicalImport.issues.${issue.code}`, { detail: issue.detail })}</span>
        </li>
      ))}
    </ul>
  );
}

export function IdentityFacts({ identity }: { identity?: SheetIdentity | null }) {
  const { t } = useTranslation();
  if (!identity || !(identity.name || identity.email || identity.accountNumber || identity.mobile || identity.nin || identity.notes)) {
    return <p className="text-start text-xs text-muted-foreground">{t("historicalImport.identityNone")}</p>;
  }
  const items = [
    ["name", identity.name],
    ["email", identity.email],
    ["code", identity.accountNumber],
    ["mobile", identity.mobile],
    ["nin", identity.nin],
    ["notes", identity.notes],
  ].filter(([, value]) => value);
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([key, value]) => (
        <div key={key} className="min-w-0 rounded-md border border-[#dfe6f6] bg-white/80 px-2.5 py-1.5 text-start">
          <dt className="text-[10px] font-semibold text-[#8a9bb8]">
            {t(`historicalImport.identity.${key}`)}
          </dt>
          <dd className="truncate text-sm font-medium text-[#0e1837]" dir={key === "name" || key === "notes" ? undefined : "ltr"}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function FormulaPreviewList({ formulas }: { formulas: PortfolioFormulaRow[] }) {
  const { t } = useTranslation();
  const colLabel = (id: string) => t(`historicalImport.formulaCols.${id}`, { defaultValue: id });
  return (
    <div className="overflow-hidden rounded-lg border border-[#c5d3c0] bg-white text-start">
      <div className="border-b border-[#c5d3c0] bg-[#217346] px-3 py-1.5 text-[12px] font-bold text-white">
        {t("historicalImport.formulasPreview")}
      </div>
      <div className="max-h-64 overflow-auto divide-y divide-[#e6ece3]">
        {formulas.map((row) => {
          const tokens = parseTokens(row.expression);
          return (
            <div key={row.key} className="flex items-center gap-2 px-2 py-1.5 text-start">
              <p className="w-36 shrink-0 truncate text-[11px] font-semibold text-[#0e1837]" title={row.label}>
                {row.label}
              </p>
              <span className="shrink-0 rounded bg-[#e2efda] px-1 font-mono text-[10px] font-bold text-[#217346]">fx</span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5" dir="ltr">
                {tokens.length === 0 ? (
                  <span className="font-mono text-[10px] text-[#53658c]">{row.expression}</span>
                ) : (
                  tokens.map((tok, i) => (
                    <span
                      key={`${row.key}-${i}`}
                      className={cn(
                        "inline-flex h-5 items-center rounded px-1 text-[10px]",
                        tok.kind === "id" && "bg-[#e8eefc] font-medium text-[#1a4cc4]",
                        tok.kind === "op" && "font-mono text-[#53658c]",
                        tok.kind === "num" && "bg-[#f3f3f3] font-data tabular-nums",
                      )}
                    >
                      {tok.kind === "id" ? colLabel(tok.value) : OP_LABEL[tok.value] ?? tok.value}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
