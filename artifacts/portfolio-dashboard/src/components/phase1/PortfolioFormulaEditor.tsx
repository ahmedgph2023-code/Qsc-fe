import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionSquare, Loader2, RotateCcw, Save, Undo2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getPortfolioFormulas, updatePortfolioFormula, type PortfolioFormulaRow } from "@/lib/api";
import { cn } from "@/lib/utils";

const CHIP =
  "h-5 max-h-5 min-h-5 appearance-none rounded border border-[#d4deef] bg-[#eef3fc] px-1 text-[10px] leading-5 text-[#1a4cc4] outline-none";
const CHIP_OP =
  "h-5 w-6 max-h-5 min-h-5 appearance-none rounded border border-transparent bg-transparent px-0 text-center font-mono text-[11px] leading-5 text-[#53658c] outline-none";
const TOOL =
  "grid h-5 w-5 place-items-center rounded border border-[#d4deef] bg-white font-mono text-[10px] leading-none text-[#2b3d67] hover:border-[#8db0ff] hover:text-[#1a4cc4]";

function shortCol(label: string) {
  return label;
}

type Token = { kind: "id" | "num" | "op"; value: string };

const OPS = ["+", "-", "*", "/", "^", "(", ")"] as const;
const OP_LABEL: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^", "(": "(", ")": ")" };

function parseTokens(expr: string): Token[] {
  const src = String(expr || "").replace(/\s+/g, "");
  const out: Token[] = [];
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

function joinTokens(tokens: Token[]): string {
  return tokens.map((t) => t.value).join(" ").replace(/\s+/g, " ").trim();
}

function replaceAt(list: Token[], index: number, next: Token): Token[] {
  return list.map((tok, i) => (i === index ? next : tok));
}

function FormulaCard({
  row,
  draft,
  onChange,
  onSave,
  saving,
  error,
}: {
  row: PortfolioFormulaRow;
  draft: Token[];
  onChange: (tokens: Token[]) => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const { t } = useTranslation();
  const [addNum, setAddNum] = useState("");
  const expr = joinTokens(draft);
  const dirty = expr !== (row.expression || "").trim();
  const allowed = new Set(row.inputs || []);
  const colLabel = (id: string) => t(`historicalImport.formulaCols.${id}`, { defaultValue: id });
  const invalid = draft.length === 0 || draft.some((tok) => tok.kind === "id" && !allowed.has(tok.value)) || draft.some((tok) => tok.kind === "num" && !tok.value);

  return (
    <article className="space-y-1 rounded-lg border border-[#e6ecf7] bg-white/90 px-2 py-1.5 text-start">
      <header className="flex items-center gap-1.5">
        <h3 className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-none">{row.label}</h3>
        <span className="shrink-0 text-[10px] text-[#8a9bb8]">{row.category}</span>
      </header>

      <div className="flex min-h-5 flex-wrap items-center gap-0.5" dir="ltr">
        {draft.length === 0 ? (
          <span className="text-[10px] text-muted-foreground">{t("historicalImport.formulaEmpty")}</span>
        ) : (
          draft.map((tok, i) => (
            <span key={`${tok.kind}-${i}`} className="group relative inline-flex items-center">
              {tok.kind === "id" ? (
                <select
                  aria-label={t("historicalImport.formulaPickColumn")}
                  title={colLabel(tok.value)}
                  className={cn(CHIP, "max-w-[7.25rem]")}
                  value={tok.value}
                  onChange={(e) => onChange(replaceAt(draft, i, { kind: "id", value: e.target.value }))}
                >
                  {(row.inputs || []).map((id) => (
                    <option key={id} value={id}>{shortCol(colLabel(id))}</option>
                  ))}
                </select>
              ) : tok.kind === "op" ? (
                <select
                  aria-label={t("historicalImport.formulaPickOp")}
                  className={CHIP_OP}
                  value={tok.value}
                  onChange={(e) => onChange(replaceAt(draft, i, { kind: "op", value: e.target.value }))}
                >
                  {OPS.map((op) => (
                    <option key={op} value={op}>{OP_LABEL[op]}</option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={t("historicalImport.formulaNumber")}
                  className="h-5 w-9 rounded border border-[#d4deef] bg-muted/40 px-1 font-data text-[10px] tabular-nums outline-none"
                  value={tok.value}
                  onChange={(e) => onChange(replaceAt(draft, i, { kind: "num", value: e.target.value.replace(/[^0-9.]/g, "") }))}
                />
              )}
              <button
                type="button"
                className="absolute -end-1 -top-1 hidden size-3.5 place-items-center rounded-full bg-[#53658c] text-white group-hover:grid"
                aria-label={t("common.delete")}
                onClick={() => onChange(draft.filter((_, idx) => idx !== i))}
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-0.5">
        <select
          aria-label={t("historicalImport.formulaPickColumn")}
          className={cn(CHIP, "max-w-[6.5rem] text-[#53658c]")}
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            onChange([...draft, { kind: "id", value: v }]);
            e.target.value = "";
          }}
        >
          <option value="">{t("historicalImport.formulaAddColumn")}</option>
          {(row.inputs || []).map((id) => (
            <option key={id} value={id}>{shortCol(colLabel(id))}</option>
          ))}
        </select>
        {OPS.map((op) => (
          <button key={op} type="button" className={TOOL} onClick={() => onChange([...draft, { kind: "op", value: op }])}>
            {OP_LABEL[op]}
          </button>
        ))}
        <input
          aria-label={t("historicalImport.formulaNumber")}
          className="h-5 w-10 rounded border border-[#d4deef] px-1 font-data text-[10px] outline-none"
          placeholder="365"
          value={addNum}
          onChange={(e) => setAddNum(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && addNum) {
              onChange([...draft, { kind: "num", value: addNum }]);
              setAddNum("");
            }
          }}
        />
        <button
          type="button"
          className="h-5 rounded px-1.5 text-[10px] font-semibold text-[#1a4cc4] disabled:opacity-40"
          disabled={!addNum}
          onClick={() => {
            onChange([...draft, { kind: "num", value: addNum }]);
            setAddNum("");
          }}
        >
          {t("historicalImport.formulaAddNum")}
        </button>
        <span className="ms-auto inline-flex items-center gap-0.5">
          <button type="button" className={TOOL} disabled={draft.length === 0} title={t("historicalImport.formulaUndo")} onClick={() => onChange(draft.slice(0, -1))}>
            <Undo2 className="size-3" />
          </button>
          <button type="button" className={TOOL} title={t("historicalImport.formulaReset")} onClick={() => onChange(parseTokens(row.defaultExpression || row.expression))}>
            <RotateCcw className="size-3" />
          </button>
          <button
            type="button"
            className="inline-flex h-5 items-center gap-0.5 rounded bg-[#1a4cc4] px-1.5 text-[10px] font-semibold text-white disabled:opacity-40"
            disabled={!dirty || saving || invalid}
            onClick={onSave}
          >
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            {t("common.save")}
          </button>
        </span>
      </div>
      {error ? <p className={cn("font-mono text-[10px] text-rose-500 wrap-break-word")}>{error}</p> : null}
    </article>
  );
}

export function PortfolioFormulaEditor() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["portfolio-formulas"], queryFn: getPortfolioFormulas });
  const [drafts, setDrafts] = useState<Record<string, Token[]>>({});
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const formulas = data?.formulas || [];

  useEffect(() => {
    const next: Record<string, Token[]> = {};
    for (const row of formulas) next[row.key] = parseTokens(row.expression);
    setDrafts(next);
  }, [data]);

  const grouped = useMemo(() => {
    const order = ["kpi", "row", "cash", "daily"];
    return order
      .map((cat) => ({ cat, rows: formulas.filter((f) => f.category === cat) }))
      .filter((g) => g.rows.length > 0);
  }, [formulas]);

  const saveMut = useMutation({
    mutationFn: ({ key, expression }: { key: string; expression: string }) =>
      updatePortfolioFormula(key, expression),
    onSuccess: (_row, vars) => {
      setErrorByKey((prev) => {
        const next = { ...prev };
        delete next[vars.key];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["portfolio-formulas"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["phase1-portfolio"] });
    },
    onError: (e: Error, vars) => {
      setErrorByKey((prev) => ({ ...prev, [vars.key]: e.message }));
    },
    onSettled: () => setSavingKey(null),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="cdp-more-metrics">
          <FunctionSquare className="me-2 size-4" />
          {t("historicalImport.formulasTitle")}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        dir={i18n.dir()}
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 text-start sm:!max-w-[44rem]"
      >
        <SheetHeader className="border-b border-[#e6ecf7] px-4 py-2 text-start">
          <SheetTitle className="text-sm">{t("historicalImport.formulasTitle")}</SheetTitle>
          <SheetDescription className="text-[11px]">{t("historicalImport.formulasDesc")}</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 px-3 py-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : (
              grouped.map((g) => (
                <section key={g.cat} className="space-y-1">
                  <h2 className="text-[11px] font-bold text-[#8a9bb8]">
                    {t(`historicalImport.formulaCat.${g.cat}`, { defaultValue: g.cat })}
                  </h2>
                  {g.rows.map((row) => (
                    <FormulaCard
                      key={row.key}
                      row={row}
                      draft={drafts[row.key] ?? parseTokens(row.expression)}
                      saving={savingKey === row.key}
                      error={errorByKey[row.key] ?? null}
                      onChange={(tokens) => setDrafts((prev) => ({ ...prev, [row.key]: tokens }))}
                      onSave={() => {
                        setSavingKey(row.key);
                        saveMut.mutate({ key: row.key, expression: joinTokens(drafts[row.key] ?? []) });
                      }}
                    />
                  ))}
                </section>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
