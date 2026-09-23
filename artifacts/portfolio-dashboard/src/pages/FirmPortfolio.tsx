import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, Inbox, Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar, useClientTablePage, ClientTableFooter } from "@/components/phase1/DataTableCard";
import { DistributionDonut } from "@/components/phase1/DistributionDonut";
import { ExcelIcon, PdfIcon } from "@/components/phase1/ExportFormatIcons";
import {
  downloadFirmPortfolio,
  downloadFirmPortfolioHolders,
  getFirmPortfolio,
  getFirmPortfolioDrilldown,
} from "@/lib/api";
import { todayQatarIso } from "@/lib/qatarDates";
import { formatQar, formatQty, formatStatementAmount } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491]";
const cellPy = { paddingTop: 8, paddingBottom: 8 } as const;
/** Follows the market while looking at today. */
const LIVE_REFRESH_MS = 30_000;

function formatPct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function parseFilters(search: string) {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    asOf: q.get("asOf") || todayQatarIso(),
    ticker: (q.get("ticker") || "").trim().toUpperCase(),
  };
}

function filtersPath(next: ReturnType<typeof parseFilters>) {
  const q = new URLSearchParams();
  q.set("asOf", next.asOf);
  if (next.ticker) q.set("ticker", next.ticker);
  return `/firm-portfolio?${q.toString()}`;
}

export default function FirmPortfolio() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const filters = useMemo(() => parseFilters(search), [search]);
  const [busyTicker, setBusyTicker] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const navigate = (next: Partial<ReturnType<typeof parseFilters>>) => {
    setLocation(filtersPath({ ...filters, ...next }));
  };

  // Prices move during the session, so an "as of today" view refreshes itself.
  const isToday = filters.asOf === todayQatarIso();
  const liveRefetch = isToday ? LIVE_REFRESH_MS : false;

  const listQuery = useQuery({
    queryKey: ["firm-portfolio", filters.asOf],
    queryFn: () => getFirmPortfolio(filters.asOf),
    enabled: !filters.ticker,
    refetchInterval: liveRefetch,
  });

  const drillQuery = useQuery({
    queryKey: ["firm-portfolio-drill", filters.asOf, filters.ticker],
    queryFn: () => getFirmPortfolioDrilldown(filters.asOf, filters.ticker),
    enabled: Boolean(filters.ticker),
    refetchInterval: liveRefetch,
  });

  const stocks = listQuery.data?.stocks ?? [];
  const holders = drillQuery.data?.holders ?? [];

  const stockSlices = useMemo(
    () => stocks.map((s) => ({ name: s.ticker, value: s.marketValue ?? 0 })),
    [stocks],
  );
  const sectorSlices = useMemo(
    () => (listQuery.data?.sectors ?? []).map((s) => ({ name: s.sector, value: s.marketValue ?? 0 })),
    [listQuery.data?.sectors],
  );
  const holderSlices = useMemo(
    () => holders.map((h) => ({ name: h.clientName || String(h.clientId), value: h.marketValue ?? 0 })),
    [holders],
  );
  const stockPaging = useClientTablePage(stocks, `${filters.asOf}|${stocks.length}`);
  const holderPaging = useClientTablePage(holders, `${filters.asOf}|${filters.ticker}|${holders.length}`);

  // The buttons export whichever table is on screen: the firm list or one stock's holders.
  const exportable = filters.ticker ? holders.length > 0 : stocks.length > 0;
  const runExport = async (format: "xlsx" | "pdf") => {
    try {
      setExporting(format);
      if (filters.ticker) await downloadFirmPortfolioHolders(filters.asOf, filters.ticker, format);
      else await downloadFirmPortfolio(filters.asOf, format);
    } catch (e) {
      window.alert((e as Error | undefined)?.message || t("firmPortfolio.exportFailed"));
    } finally {
      setExporting(null);
    }
  };

  const loading = filters.ticker ? drillQuery.isLoading : listQuery.isLoading;
  const errored = filters.ticker ? drillQuery.isError : listQuery.isError;
  const err = filters.ticker ? drillQuery.error : listQuery.error;

  return (
    <Shell>
      <PageHeader title={t("firmPortfolio.title")} description={t("firmPortfolio.description")} />
      <section className="clients-table-card overflow-hidden">
        <DataTableToolbar
          className="flex-wrap"
          icon="/security.png"
          count={
            filters.ticker
              ? filters.ticker
              : listQuery.data
                ? t("firmPortfolio.clientCount", { count: listQuery.data.clientCount })
                : undefined
          }
          countLoading={loading}
          actions={
            <>
              <DatePicker
                className="min-w-fit w-auto shrink-0"
                value={filters.asOf}
                onChange={(asOf) => navigate({ asOf, ticker: filters.ticker })}
                prefix={t("statements.asOf")}
                max={todayQatarIso()}
              />
              {filters.ticker ? (
                <Button type="button" variant="outline" size="sm" onClick={() => navigate({ ticker: "" })}>
                  <ChevronLeft className="me-1 h-4 w-4" />
                  {t("firmPortfolio.back")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (filters.ticker ? drillQuery.refetch() : listQuery.refetch())}
              >
                {(filters.ticker ? drillQuery.isFetching : listQuery.isFetching) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.refresh")
                )}
              </Button>
              <Button type="button" size="sm" disabled={!exportable || exporting !== null} onClick={() => runExport("xlsx")}>
                {exporting === "xlsx" ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExcelIcon className="me-2 h-4 w-4" />
                )}
                {t("firmPortfolio.excel")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!exportable || exporting !== null}
                onClick={() => runExport("pdf")}
              >
                {exporting === "pdf" ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <PdfIcon className="me-2 h-4 w-4" />
                )}
                {t("firmPortfolio.pdf")}
              </Button>
            </>
          }
        />

        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : errored ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("firmPortfolio.errorTitle")}
            description={(err as Error | undefined)?.message || t("firmPortfolio.errorDesc")}
          />
        ) : filters.ticker ? (
          !holders.length ? (
            <EmptyState
              className="py-16"
              icon={<Inbox className="h-12 w-12" />}
              title={t("firmPortfolio.emptyTitle")}
              description={t("firmPortfolio.emptyDesc")}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="font-semibold text-[#16305f]">
                  {drillQuery.data?.ticker} — {drillQuery.data?.companyName}
                </span>
                <span className="text-[#657491]">
                  {t("firmPortfolio.col.sector")}: {drillQuery.data?.sector || "—"}
                </span>
                <span className="text-[#657491]">
                  {t("firmPortfolio.col.marketPrice")}:{" "}
                  <span className="font-data text-[#16305f]">{formatStatementAmount(drillQuery.data?.marketPrice)}</span>
                </span>
                {isToday ? (
                  <span className="text-[11px] text-[#8a97ad]">{t("firmPortfolio.livePriceNote")}</span>
                ) : null}
              </div>
              <div className="clients-table-wrap overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={thClass}>{t("firmPortfolio.col.clientId")}</TableHead>
                      <TableHead className={thClass}>{t("firmPortfolio.col.clientName")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.qty")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.cost")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.costPrice")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketPrice")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketValue")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.holderPct")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.unrealized")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.returnPct")}</TableHead>
                      <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.realized")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holderPaging.paged.map((row) => (
                      <TableRow key={row.clientId}>
                        <TableCell style={cellPy} className="px-3.5 font-data">{row.clientId}</TableCell>
                        <TableCell style={cellPy} className="px-3.5">{row.clientName}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.quantity)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.cost)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatStatementAmount(row.costPrice)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatStatementAmount(row.marketPrice)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketValue)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatPct(row.holderPct)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.unrealizedPl)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">
                          {row.returnPct == null ? "—" : `${row.returnPct.toFixed(2)}%`}
                        </TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.realizedPl)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-[#eef3ff]">
                      <TableCell colSpan={2} style={cellPy} className="px-3.5 font-bold">{t("firmPortfolio.totals")}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQty(drillQuery.data?.totals.totalQuantity)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.totalCost)}</TableCell>
                      <TableCell colSpan={2} />
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.marketValue)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">
                        {formatPct(drillQuery.data?.totals.marketValue ? 100 : null)}
                      </TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.unrealizedPl)}</TableCell>
                      <TableCell />
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.realizedPl)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <ClientTableFooter paging={holderPaging} />
              <div className="p-4 pt-0">
                <DistributionDonut title={t("firmPortfolio.chart.holders")} slices={holderSlices} />
              </div>
            </>
          )
        ) : !stocks.length ? (
          <EmptyState
            className="py-16"
            icon={<Inbox className="h-12 w-12" />}
            title={t("firmPortfolio.emptyTitle")}
            description={t("firmPortfolio.emptyDesc")}
          />
        ) : (
          <>
            <div className="clients-table-wrap overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass}>{t("firmPortfolio.col.ticker")}</TableHead>
                    <TableHead className={thClass}>{t("firmPortfolio.col.company")}</TableHead>
                    <TableHead className={thClass}>{t("firmPortfolio.col.sector")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.clientCount")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.qty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.cost")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketPrice")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketValue")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.stockPct")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.sectorPct")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.unrealized")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.returnPct")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.realized")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockPaging.paged.map((row) => (
                    <TableRow
                      key={row.ticker}
                      className="cursor-pointer hover:bg-[#f4f7fd]"
                      onClick={() => {
                        setBusyTicker(row.ticker);
                        navigate({ ticker: row.ticker });
                      }}
                    >
                      <TableCell style={cellPy} className="px-3.5 font-data font-semibold text-[#175cd3]">
                        {busyTicker === row.ticker && drillQuery.isFetching ? (
                          <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
                        ) : null}{" "}
                        {row.ticker}
                      </TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.companyName}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.sector || "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{row.clientCount}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.totalQuantity)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.totalCost)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatStatementAmount(row.marketPrice)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketValue)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatPct(row.stockPct)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatPct(row.sectorPct)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.unrealizedPl)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">
                        {row.returnPct == null ? "—" : `${row.returnPct.toFixed(2)}%`}
                      </TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.realizedPl)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#eef3ff]">
                    <TableCell colSpan={3} style={cellPy} className="px-3.5 font-bold">{t("firmPortfolio.totals")}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQty(listQuery.data?.totals.totalQuantity)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.totalCost)}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.marketValue)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">
                      {formatPct(listQuery.data?.totals.marketValue ? 100 : null)}
                    </TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.unrealizedPl)}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.realizedPl)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <ClientTableFooter paging={stockPaging} />
            <div className="grid gap-4 p-4 pt-0 lg:grid-cols-2">
              <DistributionDonut title={t("firmPortfolio.chart.stocks")} slices={stockSlices} />
              <DistributionDonut title={t("firmPortfolio.chart.sectors")} slices={sectorSlices} />
            </div>
          </>
        )}
      </section>
    </Shell>
  );
}
