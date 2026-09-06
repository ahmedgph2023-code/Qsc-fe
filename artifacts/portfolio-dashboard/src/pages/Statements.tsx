import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { ExcelIcon, FileIcon, PdfIcon } from "@/components/phase1/ExportFormatIcons";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { StatementPreview, PortfolioStatementStats } from "@/components/statements/StatementPreview";
import { StatementInvestorDialog } from "@/components/statements/StatementInvestorDialog";
import { openStatementPrint } from "@/components/statements/statementPrintHtml";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { DataTableToolbar } from "@/components/phase1/DataTableCard";
import {
  extClientDisplayName,
  getAccountStatement,
  getExtClients,
  getPortfolioStatement,
  getRealizedDetailsStatement,
  getRealizedSummaryStatement,
  downloadStatementExcel,
  type ExtClientListRow,
} from "@/lib/api";
import { todayQatarIso } from "@/lib/qatarDates";
import {
  ensureStatementSearchDefaults,
  parseStatementFilters,
  parseStatementKind,
  statementCanLoad,
  statementFiltersPath,
  statementRangeValid,
  withStatementKind,
  type StatementFilters,
  type StatementKind,
} from "@/lib/statementFilters";
import type { ClientStatement } from "@/lib/statement-types";

export type { StatementKind };

const FILTER_SELECT = "h-9 w-auto min-w-fit max-w-[min(100%,20rem)] shrink-0";

async function loadStatement(filters: StatementFilters): Promise<ClientStatement> {
  const id = filters.clientId;
  if (filters.kind === "portfolio") {
    return getPortfolioStatement(id, filters.asOf, { includeZeroQty: filters.includeZeroQty });
  }
  if (filters.kind === "account") {
    return getAccountStatement(id, filters.from, filters.to, filters.accountLayout);
  }
  if (filters.kind === "realized_summary") {
    return getRealizedSummaryStatement(id, filters.from, filters.to);
  }
  return getRealizedDetailsStatement(id, filters.from, filters.to, filters.ticker || undefined);
}

export default function Statements() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(() => parseStatementFilters(search), [search]);

  useEffect(() => {
    const nextSearch = ensureStatementSearchDefaults(search);
    if (nextSearch != null) {
      setLocation(`/statements?${nextSearch}`, { replace: true });
    }
  }, [search, setLocation]);

  const navigate = (next: StatementFilters) => {
    setLocation(statementFiltersPath(next));
  };

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["ext-clients", filters.asOf],
    queryFn: () => getExtClients(filters.asOf),
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

  const kindOptions = useMemo(
    () =>
      (["portfolio", "account", "realized_summary", "realized_details"] as StatementKind[]).map((kind) => ({
        value: kind,
        label: t(`statements.kinds.${kind}`),
      })),
    [t],
  );

  const canLoad = statementCanLoad(filters);
  const rangeOk = statementRangeValid(filters);

  const { data: stmt, isFetching, isError, error } = useQuery({
    queryKey: ["client-statement", filters],
    queryFn: () => loadStatement(filters),
    enabled: canLoad,
  });

  const selectedClient = clients.find((row) => String(row.clientId) === filters.clientId);
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
            className={FILTER_SELECT}
            contentClassName="clients-select-content min-w-[18rem]"
            value={filters.clientId}
            onValueChange={(clientId) => navigate({ ...filters, clientId })}
            options={clientOptions}
            placeholder={clientsLoading ? t("common.loading") : t("statements.chooseClient")}
            searchPlaceholder={t("statements.searchClient")}
            emptyText={t("statements.noClientMatch")}
            aria-label={t("common.client")}
          />
          <SelectField
            className={FILTER_SELECT}
            contentClassName="clients-select-content min-w-[12rem]"
            value={filters.kind}
            onValueChange={(kind) => navigate(withStatementKind(filters, parseStatementKind(kind)))}
            options={kindOptions}
            aria-label={t("statements.kind")}
          />
          {filters.kind === "account" ? (
            <label className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-[#e1e7f0] bg-white px-3 text-[12px] font-medium text-[#657491]">
              <span className={filters.accountLayout === "grouped" ? "font-semibold text-[#17356d]" : ""}>
                {t("statements.accountLayout.grouped")}
              </span>
              <Switch
                checked={filters.accountLayout === "detailed"}
                onCheckedChange={(detailed) => navigate({
                  ...filters,
                  accountLayout: detailed ? "detailed" : "grouped",
                })}
                aria-label={t("statements.accountLayout.label")}
              />
              <span className={filters.accountLayout === "detailed" ? "font-semibold text-[#17356d]" : ""}>
                {t("statements.accountLayout.detailed")}
              </span>
            </label>
          ) : null}
          {filters.kind === "portfolio" ? (
            <>
              <DatePicker
                className="min-w-fit w-auto shrink-0"
                prefix={t("statements.asOf")}
                value={filters.asOf}
                onChange={(iso) => navigate({ ...filters, asOf: iso || todayQatarIso() })}
                max={todayQatarIso()}
              />
              <label className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-[#e1e7f0] bg-white px-3 text-[12px] font-medium text-[#657491]">
                <Switch
                  checked={filters.includeZeroQty}
                  onCheckedChange={(includeZeroQty) => navigate({ ...filters, includeZeroQty })}
                  aria-label={t("statements.includeZeroQty")}
                />
                <span>{t("statements.includeZeroQty")}</span>
              </label>
            </>
          ) : (
            <DateRangePicker
              className="min-w-fit w-auto shrink-0"
              from={filters.from}
              to={filters.to}
              max={todayQatarIso()}
              onChange={({ from, to }) => navigate({ ...filters, from, to })}
            />
          )}
        </>
      }
    />
  );

  return (
    <Shell>
      <PageHeader
        className="!mt-4"
        title={t("statements.title")}
        description={t("statements.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {stmt ? (
              <StatementInvestorDialog investor={stmt.investor} dates={stmt.dates} />
            ) : null}
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
              <PdfIcon className="me-2" />
              {t("statements.pdf")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canLoad || exporting}
              onClick={async () => {
                if (!canLoad) return;
                setExporting(true);
                try {
                  await downloadStatementExcel(filters.clientId, filters.kind, filters);
                } catch (err) {
                  console.error(err);
                  window.alert((err as Error | undefined)?.message || t("statements.exportFailed"));
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? <Loader2 className="animate-spin" /> : <ExcelIcon className="me-2" />}
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
        {!rangeOk && filters.kind !== "portfolio" ? (
          <p className="px-5 py-3 text-sm text-loss">{t("statements.invalidRange")}</p>
        ) : null}
        {!filters.clientId ? (
          <EmptyState
            className="py-16"
            icon={<FileIcon className="h-12 w-12" />}
            title={t("statements.emptyTitle")}
            description={t("statements.emptyDesc")}
          />
        ) : !canLoad ? (
          <EmptyState
            className="py-16"
            icon={<FileIcon className="h-12 w-12" />}
            title={t("statements.emptyTitle")}
            description={t("statements.invalidRange")}
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
          <StatementPreview
            stmt={stmt}
            onOpenDetails={(ticker) =>
              navigate({
                ...withStatementKind(filters, "realized_details"),
                ticker,
              })
            }
            detailsTickerFilter={filters.ticker}
            onDetailsTickerFilter={(ticker) => navigate({ ...filters, ticker })}
          />
        ) : (
          <EmptyState
            className="py-16"
            icon={<Inbox className="h-12 w-12" />}
            title={t("statements.noDataTitle")}
            description={t("statements.noDataDesc")}
          />
        )}
      </section>
    </Shell>
  );
}

function clientLabel(row: ExtClientListRow, locale: string) {
  const name = extClientDisplayName(row, locale)?.trim() || "—";
  const nin = row.nin != null && String(row.nin).trim() !== "" ? String(row.nin).trim() : "";
  return nin ? `${name} · ${nin}` : name;
}

function clientSearchText(row: ExtClientListRow, locale: string) {
  // User-facing identity is name + NIN; internal trading IDs stay searchable for ops only.
  return [
    extClientDisplayName(row, locale),
    row.name,
    row.nameEn,
    row.nameAr,
    row.nin,
  ]
    .filter((part) => part != null && String(part).trim() !== "")
    .join(" ")
    .toLowerCase();
}
