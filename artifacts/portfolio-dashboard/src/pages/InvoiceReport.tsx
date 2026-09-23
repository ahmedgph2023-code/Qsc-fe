import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { ExcelIcon, PdfIcon } from "@/components/phase1/ExportFormatIcons";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar, useClientTablePage, ClientTableFooter } from "@/components/phase1/DataTableCard";
import {
  downloadInvoiceReportExcel,
  downloadInvoiceReportPdf,
  getInvoiceReport,
  getInvoiceReportClients,
  type InvoiceOrderTypeFilter,
} from "@/lib/api";
import { todayQatarIso } from "@/lib/qatarDates";
import { formatQar, formatQty, formatStatementAmount } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const FILTER_SELECT = "h-9 w-auto min-w-fit max-w-[min(100%,18rem)] shrink-0";
const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491]";
const cellPy = { paddingTop: 8, paddingBottom: 8 } as const;

function parseFilters(search: string) {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const today = todayQatarIso();
  const orderType = (q.get("orderType") || "all").toLowerCase();
  return {
    from: q.get("from") || today,
    to: q.get("to") || today,
    clientId: q.get("client") || "",
    ticker: (q.get("ticker") || "").trim().toUpperCase(),
    orderType: (orderType === "buy" || orderType === "sell" ? orderType : "all") as InvoiceOrderTypeFilter,
    invNo: (q.get("invNo") || "").replace(/\D/g, ""),
  };
}

function filtersPath(next: ReturnType<typeof parseFilters>) {
  const q = new URLSearchParams();
  q.set("from", next.from);
  q.set("to", next.to);
  if (next.clientId) q.set("client", next.clientId);
  if (next.ticker) q.set("ticker", next.ticker);
  if (next.orderType !== "all") q.set("orderType", next.orderType);
  if (next.invNo) q.set("invNo", next.invNo);
  return `/invoice-report?${q.toString()}`;
}

export default function InvoiceReport() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);
  const filters = useMemo(() => parseFilters(search), [search]);
  const rangeOk = filters.from <= filters.to;

  const runExport = async (format: "excel" | "pdf") => {
    const query = {
      from: filters.from,
      to: filters.to,
      clientId: filters.clientId || undefined,
      ticker: filters.ticker || undefined,
      orderType: filters.orderType,
      invNo: filters.invNo || undefined,
    };
    try {
      setExporting(format);
      if (format === "pdf") await downloadInvoiceReportPdf(query);
      else await downloadInvoiceReportExcel(query);
    } catch (err) {
      window.alert((err as Error | undefined)?.message || t("invoiceReport.exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const navigate = (next: Partial<ReturnType<typeof parseFilters>>) => {
    setLocation(filtersPath({ ...filters, ...next }));
  };

  // Customer list follows the selected period — same rule the Stock list uses.
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["invoice-clients", filters.from, filters.to, filters.ticker, filters.orderType],
    queryFn: () =>
      getInvoiceReportClients({
        from: filters.from,
        to: filters.to,
        ticker: filters.ticker || undefined,
        orderType: filters.orderType,
      }),
    enabled: rangeOk,
  });

  const clientOptions = useMemo(
    () => [
      { value: "", label: t("invoiceReport.allClients"), search: "all" },
      ...clients.map((row) => ({
        value: String(row.clientId),
        label: `${row.clientId} — ${row.name}`,
        search: `${row.clientId} ${row.nin} ${row.name}`,
      })),
    ],
    [clients, t],
  );

  const orderTypeOptions = useMemo(
    () => [
      { value: "all", label: t("invoiceReport.orderType.all"), search: "all" },
      { value: "buy", label: t("invoiceReport.orderType.buy"), search: "buy" },
      { value: "sell", label: t("invoiceReport.orderType.sell"), search: "sell" },
    ],
    [t],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      "invoice-report",
      filters.from,
      filters.to,
      filters.clientId,
      filters.ticker,
      filters.orderType,
      filters.invNo,
    ],
    queryFn: () =>
      getInvoiceReport({
        from: filters.from,
        to: filters.to,
        clientId: filters.clientId || undefined,
        ticker: filters.ticker || undefined,
        orderType: filters.orderType,
        invNo: filters.invNo || undefined,
      }),
    enabled: rangeOk,
  });

  const tickerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of data?.rows ?? []) if (r.ticker) set.add(r.ticker);
    return [
      { value: "", label: t("invoiceReport.allTickers"), search: "all" },
      ...[...set].sort().map((ticker) => ({ value: ticker, label: ticker, search: ticker })),
    ];
  }, [data?.rows, t]);

  // Picking one invoice narrows the result to that invoice, so remember the
  // numbers seen while the filter was "All" and keep offering them.
  const knownInvNos = useRef<string[]>([]);
  if (!filters.invNo && data?.rows) {
    knownInvNos.current = [...new Set(data.rows.map((r) => r.invNo).filter((n): n is number => n != null))]
      .sort((a, b) => b - a)
      .map(String);
  }
  const invNoOptions = useMemo(() => {
    const numbers = new Set(knownInvNos.current);
    if (filters.invNo) numbers.add(filters.invNo);
    return [
      { value: "", label: t("invoiceReport.allInvoices"), search: "all" },
      ...[...numbers].sort((a, b) => Number(b) - Number(a)).map((n) => ({ value: n, label: n, search: n })),
    ];
  }, [filters.invNo, data?.rows, t]);

  const paging = useClientTablePage(
    data?.rows ?? [],
    `${filters.from}|${filters.to}|${filters.clientId}|${filters.ticker}|${filters.orderType}|${filters.invNo}|${data?.rows.length ?? 0}`,
  );

  return (
    <Shell>
      <PageHeader title={t("invoiceReport.title")} description={t("invoiceReport.description")} />
      <section className="clients-table-card overflow-hidden">
        <DataTableToolbar
          className="flex-wrap"
          icon="/user.png"
          count={data ? t("invoiceReport.totals") + `: ${data.totals.count}` : undefined}
          countLoading={isLoading}
          actions={
            <>
              <DateRangePicker
                className="min-w-fit w-auto shrink-0"
                from={filters.from}
                to={filters.to}
                max={todayQatarIso()}
                onChange={({ from, to }) => navigate({ from, to })}
              />
              <SelectField
                className={FILTER_SELECT}
                contentClassName="clients-select-content min-w-[18rem]"
                value={filters.clientId}
                onValueChange={(clientId) => navigate({ clientId })}
                options={clientOptions}
                placeholder={clientsLoading ? t("common.loading") : t("invoiceReport.allClients")}
                searchPlaceholder={t("statements.searchClient")}
                emptyText={t("statements.noClientMatch")}
              />
              <SelectField
                className={FILTER_SELECT}
                contentClassName="clients-select-content min-w-[12rem]"
                value={filters.ticker}
                onValueChange={(ticker) => navigate({ ticker })}
                options={tickerOptions}
                placeholder={t("invoiceReport.allTickers")}
                searchPlaceholder={t("statements.searchTicker")}
                emptyText={t("statements.noTickerMatch")}
              />
              <SelectField
                className={FILTER_SELECT}
                contentClassName="clients-select-content min-w-[10rem]"
                value={filters.orderType}
                onValueChange={(orderType) => navigate({ orderType: orderType as InvoiceOrderTypeFilter })}
                options={orderTypeOptions}
                placeholder={t("invoiceReport.orderType.all")}
              />
              <SelectField
                className={FILTER_SELECT}
                contentClassName="clients-select-content min-w-[12rem]"
                value={filters.invNo}
                onValueChange={(invNo) => navigate({ invNo })}
                options={invNoOptions}
                placeholder={t("invoiceReport.allInvoices")}
                searchPlaceholder={t("invoiceReport.searchInvoice")}
                emptyText={t("invoiceReport.noInvoiceMatch")}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.refresh")}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!data || exporting !== null}
                onClick={() => runExport("excel")}
              >
                <ExcelIcon className="me-2 h-4 w-4" />
                {t("invoiceReport.excel")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!data || exporting !== null}
                onClick={() => runExport("pdf")}
              >
                <PdfIcon className="me-2 h-4 w-4" />
                {t("invoiceReport.pdf")}
              </Button>
            </>
          }
        />

        {!rangeOk ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("statements.invalidRange")}
            description={t("statements.invalidRange")}
          />
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("invoiceReport.errorTitle")}
            description={(error as Error | undefined)?.message || t("invoiceReport.errorDesc")}
          />
        ) : !data?.rows.length ? (
          <EmptyState
            className="py-16"
            icon={<Inbox className="h-12 w-12" />}
            title={t("invoiceReport.emptyTitle")}
            description={t("invoiceReport.emptyDesc")}
          />
        ) : (
          <>
            <div className="clients-table-wrap overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass}>{t("invoiceReport.col.invSequence")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.invNo")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.orderSide")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.nin")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.accountName")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.ticker")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.company")}</TableHead>
                    <TableHead className={thClass}>{t("invoiceReport.col.tradeDate")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("invoiceReport.col.qty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("invoiceReport.col.priceAvg")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("invoiceReport.col.amount")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("invoiceReport.col.totalComm")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("invoiceReport.col.net")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paging.paged.map((row) => (
                    <TableRow key={`${row.invSequence}-${row.invNo}-${row.accountId}-${row.ticker}-${row.tradeDate}-${row.invType}`}>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.invSequence ?? "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.invNo ?? "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.orderSide}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.nin || "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.accountName}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.ticker}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.company}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.tradeDate}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.qty)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatStatementAmount(row.priceAvg)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.amount)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.totalComm)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.net)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#eef3ff]">
                    <TableCell colSpan={8} style={cellPy} className="px-3.5 font-bold">{t("invoiceReport.totals")}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQty(data.totals.qty)}</TableCell>
                    <TableCell style={cellPy} />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(data.totals.amount)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(data.totals.totalComm)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(data.totals.net)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <ClientTableFooter paging={paging} />
          </>
        )}
      </section>
    </Shell>
  );
}
