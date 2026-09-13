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
import { getFirmPortfolio, getFirmPortfolioDrilldown } from "@/lib/api";
import { todayQatarIso } from "@/lib/qatarDates";
import { formatQar, formatQty } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491]";
const cellPy = { paddingTop: 8, paddingBottom: 8 } as const;

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

  const navigate = (next: Partial<ReturnType<typeof parseFilters>>) => {
    setLocation(filtersPath({ ...filters, ...next }));
  };

  const listQuery = useQuery({
    queryKey: ["firm-portfolio", filters.asOf],
    queryFn: () => getFirmPortfolio(filters.asOf),
    enabled: !filters.ticker,
  });

  const drillQuery = useQuery({
    queryKey: ["firm-portfolio-drill", filters.asOf, filters.ticker],
    queryFn: () => getFirmPortfolioDrilldown(filters.asOf, filters.ticker),
    enabled: Boolean(filters.ticker),
  });

  const stocks = listQuery.data?.stocks ?? [];
  const holders = drillQuery.data?.holders ?? [];
  const stockPaging = useClientTablePage(stocks, `${filters.asOf}|${stocks.length}`);
  const holderPaging = useClientTablePage(holders, `${filters.asOf}|${filters.ticker}|${holders.length}`);

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
              <p className="px-5 py-3 text-sm font-semibold text-[#16305f]">
                {drillQuery.data?.ticker} — {drillQuery.data?.companyName}
              </p>
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
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.costPrice)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketPrice)}</TableCell>
                        <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketValue)}</TableCell>
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
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.unrealizedPl)}</TableCell>
                      <TableCell />
                      <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(drillQuery.data?.totals.realizedPl)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <ClientTableFooter paging={holderPaging} />
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
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.clientCount")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.qty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.cost")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketPrice")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("firmPortfolio.col.marketValue")}</TableHead>
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
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{row.clientCount}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.totalQuantity)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.totalCost)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketPrice)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.marketValue)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.unrealizedPl)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">
                        {row.returnPct == null ? "—" : `${row.returnPct.toFixed(2)}%`}
                      </TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.realizedPl)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#eef3ff]">
                    <TableCell colSpan={2} style={cellPy} className="px-3.5 font-bold">{t("firmPortfolio.totals")}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQty(listQuery.data?.totals.totalQuantity)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.totalCost)}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.marketValue)}</TableCell>
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.unrealizedPl)}</TableCell>
                    <TableCell />
                    <TableCell style={cellPy} className="px-3.5 text-end font-data font-bold">{formatQar(listQuery.data?.totals.realizedPl)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <ClientTableFooter paging={stockPaging} />
          </>
        )}
      </section>
    </Shell>
  );
}
