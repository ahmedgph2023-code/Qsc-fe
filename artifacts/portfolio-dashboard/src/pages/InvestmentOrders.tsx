import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { SelectField } from "@/components/phase1/SelectField";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar, useClientTablePage, ClientTableFooter } from "@/components/phase1/DataTableCard";
import { getInvestmentClientOrders } from "@/lib/api";
import { formatQar, formatQty } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491]";
const cellPy = { paddingTop: 8, paddingBottom: 8 } as const;
const POLL_MS = 15_000;

function parseFilters(search: string) {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return { status: (q.get("status") || "").trim().toUpperCase() };
}

function filtersPath(next: ReturnType<typeof parseFilters>) {
  const q = new URLSearchParams();
  if (next.status) q.set("status", next.status);
  const qs = q.toString();
  return qs ? `/investment-orders?${qs}` : "/investment-orders";
}

function validityLabel(
  validity: { kind: "Daily" } | { kind: "Date"; until: string | null },
  t: (k: string, o?: Record<string, string>) => string,
) {
  if (validity.kind === "Daily") return t("investmentOrders.validityDaily");
  return t("investmentOrders.validityDate", { date: validity.until || "—" });
}

export default function InvestmentOrders() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const filters = useMemo(() => parseFilters(search), [search]);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("investmentOrders.allStatuses"), search: "all" },
      ...(["A", "P", "S", "C", "E", "R"] as const).map((code) => ({
        value: code,
        label: `${code} — ${t(`investmentOrders.status.${code}`)}`,
        search: `${code} ${t(`investmentOrders.status.${code}`)}`,
      })),
    ],
    [t],
  );

  const { data, isLoading, isError, error, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["investment-orders", filters.status],
    queryFn: () => getInvestmentClientOrders(filters.status || undefined),
    refetchInterval: POLL_MS,
  });

  const rows = data?.rows ?? [];
  const paging = useClientTablePage(rows, `${filters.status}|${rows.length}|${dataUpdatedAt}`);

  return (
    <Shell>
      <PageHeader title={t("investmentOrders.title")} description={t("investmentOrders.description")} />
      <section className="clients-table-card overflow-hidden">
        <DataTableToolbar
          className="flex-wrap"
          icon="/Cash-2.png"
          count={data?.tableFound ? String(rows.length) : undefined}
          countLoading={isLoading}
          actions={
            <>
              <SelectField
                className="h-9 w-auto min-w-fit max-w-[min(100%,18rem)]"
                value={filters.status}
                onValueChange={(status) => setLocation(filtersPath({ status }))}
                options={statusOptions}
                placeholder={t("investmentOrders.allStatuses")}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.refresh")}
              </Button>
              {data?.polledAtIso ? (
                <span className="text-xs text-[#657491]">
                  {t("investmentOrders.lastPoll", { time: new Date(data.polledAtIso).toLocaleTimeString() })}
                </span>
              ) : null}
            </>
          }
        />

        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("investmentOrders.errorTitle")}
            description={(error as Error | undefined)?.message || t("investmentOrders.errorDesc")}
          />
        ) : data && !data.tableFound ? (
          <EmptyState
            className="py-16"
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("investmentOrders.tableMissingTitle")}
            description={data.warning || t("investmentOrders.tableMissingDesc")}
          />
        ) : !rows.length ? (
          <EmptyState
            className="py-16"
            icon={<Inbox className="h-12 w-12" />}
            title={t("investmentOrders.emptyTitle")}
            description={t("investmentOrders.emptyDesc")}
          />
        ) : (
          <>
            <div className="clients-table-wrap overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass}>{t("investmentOrders.col.orderNumber")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.orderType")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.clientId")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.clientName")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.ticker")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.status")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.orderDate")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("investmentOrders.col.totalQty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("investmentOrders.col.remainingQty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("investmentOrders.col.executedQty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("investmentOrders.col.displayedQty")}</TableHead>
                    <TableHead className={cn(thClass, "text-end")}>{t("investmentOrders.col.orderValue")}</TableHead>
                    <TableHead className={thClass}>{t("investmentOrders.col.validity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paging.paged.map((row) => (
                    <TableRow key={`${row.orderNumber}-${row.clientId}-${row.ticker}-${row.statusCode}`}>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.orderNumber}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.orderType}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.clientId ?? "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{row.clientName}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.ticker}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">
                        <span className="font-data">{row.statusCode}</span>
                        <span className="text-[#657491]"> — {row.statusLabel}</span>
                      </TableCell>
                      <TableCell style={cellPy} className="px-3.5 font-data">{row.orderDate || "—"}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.totalQty)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.remainingQty)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.executedQty)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQty(row.displayedQty)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5 text-end font-data">{formatQar(row.orderValue)}</TableCell>
                      <TableCell style={cellPy} className="px-3.5">{validityLabel(row.validity, t)}</TableCell>
                    </TableRow>
                  ))}
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
