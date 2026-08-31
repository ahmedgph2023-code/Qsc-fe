import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, FileDown, FileSpreadsheet, FileText, Inbox, Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { StatementPreview, PortfolioStatementStats } from "@/components/statements/StatementPreview";
import { openStatementPrint } from "@/components/statements/statementPrintHtml";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import { DataTableIconBtn, DataTableToolbar } from "@/components/phase1/DataTableCard";
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

function isDraftApplied(
  draft: ReturnType<typeof readDraftFromUrl>,
  applied: ReturnType<typeof readDraftFromUrl> | null,
) {
  if (!applied) return false;
  if (draft.clientId !== applied.clientId || draft.kind !== applied.kind) return false;
  if (draft.kind === "portfolio") return draft.asOf === applied.asOf;
  return draft.from === applied.from && draft.to === applied.to;
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

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["ext-clients", draft.asOf],
    queryFn: () => getExtClients(draft.asOf),
  });

  const clientOptions = useMemo(
    () =>
      clients.map((row) => ({
        value: String(row.clientId),
        label: clientLabel(row, i18n.language),
        search: clientSearchText(row, i18n.language),
      })),
    [clients, i18n.language],
  );

  const rangeOk = !!draft.from && !!draft.to && draft.from <= draft.to;
  const canRun = !!draft.clientId && (draft.kind === "portfolio" ? !!draft.asOf : rangeOk);
  const filtersDirty = !isDraftApplied(draft, applied);

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

  const selectedClient = clients.find((row) => String(row.clientId) === draft.clientId);
  const toolbarCount = stmt
    ? `${stmt.investor.displayName || stmt.investor.nameAr || stmt.investor.nameEn} · ${stmt.investor.nin}`
    : selectedClient
      ? clientLabel(selectedClient, i18n.language)
      : t("statements.title");

  const toolbar = (
    <DataTableToolbar
      className="flex-wrap"
      icon="/user.png"
      count={toolbarCount}
      countLoading={clientsLoading}
      actions={
        <>
          <SelectField
            className="h-9 w-[240px] min-w-[240px] max-w-[240px] shrink-0"
            contentClassName="clients-select-content min-w-[18rem]"
            value={draft.clientId}
            onValueChange={(clientId) => setDraft((d) => ({ ...d, clientId }))}
            options={clientOptions}
            placeholder={clientsLoading ? t("common.loading") : t("statements.pickClient")}
            searchPlaceholder={t("statements.searchClient")}
            emptyText={t("statements.noClientMatch")}
            aria-label={t("common.client")}
          />
          <SelectField
            className="h-9 w-[150px] min-w-[150px] max-w-[150px] shrink-0"
            contentClassName="clients-select-content min-w-[18rem]"
            value={draft.kind}
            onValueChange={(kind) => setDraft((d) => ({ ...d, kind: parseKind(kind) }))}
            options={KINDS.map((kind) => ({ value: kind, label: t(`statements.kinds.${kind}`) }))}
            aria-label={t("statements.kind")}
          />
          {draft.kind === "portfolio" ? (
            <DatePicker
              className="min-w-44 w-auto"
              prefix={t("statements.asOf")}
              value={draft.asOf}
              onChange={(iso) => setDraft((d) => ({ ...d, asOf: iso || todayQatarIso() }))}
              max={todayQatarIso()}
            />
          ) : (
            <DateRangePicker
              className="min-w-56 w-auto"
              from={draft.from}
              to={draft.to}
              onChange={({ from, to }) => setDraft((d) => ({ ...d, from, to }))}
            />
          )}
          {filtersDirty ? (
            <DataTableIconBtn
              label={t("statements.applyFilters")}
              icon={<ArrowRight className="size-5 rtl:rotate-180" />}
              active
              disabled={!canRun || isFetching}
              onClick={apply}
            />
          ) : null}
        </>
      }
    />
  );

  return (
    <Shell>
      <PageHeader  className="!mt-4"
        title={t("statements.title")}
        description={t("statements.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!stmt}
              onClick={() => {
                try {
                  if (stmt) openStatementPrint(stmt);
                } catch (err) {
                  console.error(err);
                  window.alert(t("statements.printFailed"));
                }
              }}
            >
              <FileDown />
              {t("statements.pdf")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!applied || exporting}
              onClick={async () => {
                if (!applied) return;
                setExporting(true);
                try {
                  await downloadStatementExcel(applied.clientId, applied.kind, applied);
                } catch (err) {
                  console.error(err);
                  window.alert((err as Error | undefined)?.message || t("statements.exportFailed"));
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
              {t("statements.excel")}
            </Button>
          </div>
        }
      />

      {stmt?.kind === "portfolio" ? (
        <div className="mb-6">
          <PortfolioStatementStats stmt={stmt} />
        </div>
      ) : null}

      <section className="clients-table-card overflow-hidden">
        {toolbar}
        {!rangeOk && draft.kind !== "portfolio" ? (
          <p className="px-5 py-3 text-sm text-loss">{t("statements.invalidRange")}</p>
        ) : null}
        {!applied ? (
          <EmptyState
            className="py-16"
            icon={<FileText className="h-12 w-12" />}
            title={t("statements.emptyTitle")}
            description={t("statements.emptyDesc")}
          />
        ) : isFetching && !stmt ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("statements.errorTitle")}
            description={(error as Error | undefined)?.message || t("statements.errorDesc")}
          />
        ) : stmt ? (
          <StatementPreview stmt={stmt} />
        ) : (
          <EmptyState
            className="py-16"
            icon={<Inbox className="h-12 w-12" />}
            title={t("statements.noDataTitle")}
            description={t("statements.noDataDesc")}
          />
        )}
      </section>

      {/* <p className="mt-8 text-sm text-muted-foreground">{t("statements.openQuestionsHint")}</p>
      <BlockedBoardTable rows={openQs?.rows ?? []} askPrefix="statements.ask" /> */}
    </Shell>
  );
}

function clientLabel(row: ExtClientListRow, locale: string) {
  const name = extClientDisplayName(row, locale) || row.accountNumber;
  return `${name} · ${row.clientId}`;
}

function clientSearchText(row: ExtClientListRow, locale: string) {
  return [
    extClientDisplayName(row, locale),
    row.name,
    row.nameEn,
    row.nameAr,
    row.clientId,
    row.nin,
    row.accountNumber,
    row.mainObjCode,
    row.id,
  ]
    .filter((part) => part != null && String(part).trim() !== "")
    .join(" ")
    .toLowerCase();
}
