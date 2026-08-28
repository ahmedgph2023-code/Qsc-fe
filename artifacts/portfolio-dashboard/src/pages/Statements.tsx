import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, FileText, Inbox, Printer } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { StatementPreview } from "@/components/statements/StatementPreview";
import { openStatementPrint } from "@/components/statements/statementPrintHtml";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import {
  extClientDisplayName,
  getAccountStatement,
  getExtClients,
  getPortfolioStatement,
  getRealizedDetailsStatement,
  getRealizedSummaryStatement,
  downloadStatementExcel,
  getStatementQuestions,
  type ExtClientListRow,
} from "@/lib/api";
import type { ClientStatement } from "@/lib/statement-types";

export type StatementKind = "portfolio" | "account" | "realized_summary" | "realized_details";

const KINDS: StatementKind[] = ["portfolio", "account", "realized_summary", "realized_details"];

const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });
const yearStartIso = () => `${todayQatarIso().slice(0, 4)}-01-01`;

function parseKind(raw: string | null): StatementKind {
  return KINDS.includes(raw as StatementKind) ? (raw as StatementKind) : "portfolio";
}

function readDraftFromUrl() {
  const q = new URLSearchParams(window.location.search);
  const today = todayQatarIso();
  return {
    clientId: q.get("client") || "",
    kind: parseKind(q.get("kind")),
    asOf: q.get("asOf") || today,
    from: q.get("from") || yearStartIso(),
    to: q.get("to") || today,
  };
}

function statementQuery(draft: ReturnType<typeof readDraftFromUrl>) {
  const q = new URLSearchParams();
  if (draft.clientId) q.set("client", draft.clientId);
  q.set("kind", draft.kind);
  if (draft.kind === "portfolio") q.set("asOf", draft.asOf);
  else {
    q.set("from", draft.from);
    q.set("to", draft.to);
  }
  return `/statements?${q.toString()}`;
}

async function loadStatement(draft: ReturnType<typeof readDraftFromUrl>): Promise<ClientStatement> {
  const id = draft.clientId;
  if (draft.kind === "portfolio") return getPortfolioStatement(id, draft.asOf);
  if (draft.kind === "account") return getAccountStatement(id, draft.from, draft.to);
  if (draft.kind === "realized_summary") return getRealizedSummaryStatement(id, draft.from, draft.to);
  return getRealizedDetailsStatement(id, draft.from, draft.to);
}

export default function Statements() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [draft, setDraft] = useState(readDraftFromUrl);
  const [applied, setApplied] = useState(() => {
    const initial = readDraftFromUrl();
    return initial.clientId ? initial : null;
  });
  const [exporting, setExporting] = useState(false);
  const [clientFilter, setClientFilter] = useState("");

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["ext-clients", draft.asOf],
    queryFn: () => getExtClients(draft.asOf),
  });

  const clientOptions = useMemo(() => {
    const q = clientFilter.trim().toLowerCase();
    const filtered = !q
      ? clients
      : clients.filter((row) => {
          const name = extClientDisplayName(row, i18n.language).toLowerCase();
          return (
            name.includes(q) ||
            String(row.clientId).includes(q) ||
            (row.nin || "").toLowerCase().includes(q) ||
            (row.accountNumber || "").toLowerCase().includes(q)
          );
        });
    const selected = clients.find((row) => String(row.clientId) === draft.clientId);
    const top = filtered.slice(0, 80);
    if (selected && !top.some((row) => row.clientId === selected.clientId)) top.unshift(selected);
    return top.map((row) => ({
      value: String(row.clientId),
      label: clientLabel(row, i18n.language),
    }));
  }, [clients, clientFilter, draft.clientId, i18n.language]);

  const rangeOk = !!draft.from && !!draft.to && draft.from <= draft.to;
  const canRun = !!draft.clientId && (draft.kind === "portfolio" ? !!draft.asOf : rangeOk);

  const { data: stmt, isFetching, isError, error } = useQuery({
    queryKey: ["client-statement", applied],
    queryFn: () => loadStatement(applied!),
    enabled: !!applied?.clientId,
  });
  const { data: openQs } = useQuery({
    queryKey: ["statement-questions"],
    queryFn: getStatementQuestions,
  });

  function apply() {
    if (!canRun) return;
    setApplied(draft);
    setLocation(statementQuery(draft));
  }

  return (
    <Shell>
      <PageHeader
        title={t("statements.title")}
        description={t("statements.description")}
        actions={
          stmt && applied ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openStatementPrint(stmt)}>
                <Printer className="me-2 h-4 w-4" />
                {t("common.print")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    await downloadStatementExcel(applied.clientId, applied.kind, applied);
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                <FileSpreadsheet className="me-2 h-4 w-4" />
                {t("statements.excel")}
              </Button>
            </div>
          ) : null
        }
      />

      <FilterBar className="mb-6 items-end">
        <div className="min-w-48 flex-1 space-y-1">
          <Input
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            placeholder={t("statements.searchClient")}
            aria-label={t("statements.searchClient")}
          />
        </div>
        <SelectField
          className="min-w-64"
          value={draft.clientId}
          onValueChange={(clientId) => setDraft((d) => ({ ...d, clientId }))}
          options={[{ value: "", label: t("statements.pickClient") }, ...clientOptions]}
          placeholder={clientsLoading ? t("common.loading") : t("statements.pickClient")}
          aria-label={t("common.client")}
        />
        <SelectField
          className="min-w-52"
          value={draft.kind}
          onValueChange={(kind) => setDraft((d) => ({ ...d, kind: parseKind(kind) }))}
          options={KINDS.map((kind) => ({ value: kind, label: t(`statements.kinds.${kind}`) }))}
          aria-label={t("statements.kind")}
        />
        {draft.kind === "portfolio" ? (
          <DatePicker
            prefix={t("statements.asOf")}
            value={draft.asOf}
            onChange={(iso) => setDraft((d) => ({ ...d, asOf: iso || todayQatarIso() }))}
            max={todayQatarIso()}
          />
        ) : (
          <DateRangePicker
            from={draft.from}
            to={draft.to}
            onChange={({ from, to }) => setDraft((d) => ({ ...d, from, to }))}
          />
        )}
        <Button type="button" onClick={apply} disabled={!canRun || isFetching}>
          {t("statements.generate")}
        </Button>
      </FilterBar>

      {!rangeOk && draft.kind !== "portfolio" ? (
        <p className="mb-4 text-sm text-loss">{t("statements.invalidRange")}</p>
      ) : null}

      {!applied ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={t("statements.emptyTitle")}
          description={t("statements.emptyDesc")}
        />
      ) : isFetching && !stmt ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title={t("statements.errorTitle")}
          description={(error as Error | undefined)?.message || t("statements.errorDesc")}
        />
      ) : stmt ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {stmt.investor.displayName || stmt.investor.nameAr || stmt.investor.nameEn}
            {" · "}
            NIN <bdi className="font-data" dir="ltr">{stmt.investor.nin}</bdi>
            {" · "}
            {t("statements.screenPreviewHint")}
          </p>
          <StatementPreview stmt={stmt} />
        </div>
      ) : (
        <EmptyState
          icon={<Inbox className="h-12 w-12" />}
          title={t("statements.noDataTitle")}
          description={t("statements.noDataDesc")}
        />
      )}

      <p className="mt-8 text-sm text-muted-foreground">{t("statements.openQuestionsHint")}</p>
      <BlockedBoardTable rows={openQs?.rows ?? []} askPrefix="statements.ask" />
    </Shell>
  );
}

function clientLabel(row: ExtClientListRow, locale: string) {
  const name = extClientDisplayName(row, locale) || row.accountNumber;
  return `${name} · ${row.clientId}`;
}
