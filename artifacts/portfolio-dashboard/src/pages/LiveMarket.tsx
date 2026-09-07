import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { SelectField } from "@/components/phase1/SelectField";
import {
  AppTable,
  ClientTableFooter,
  DataTableEmpty,
  DataTableHead,
  DataTableToolbar,
  useClientTablePage,
} from "@/components/phase1/DataTableCard";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  getLiveIndices,
  getLiveQuotes,
  getLiveStatus,
  loadLiveSample,
  type LiveQuote,
} from "@/lib/api";
import { CompanyTickerIcon } from "@/components/phase1/CompanyTickerIcon";
import { cn } from "@/lib/utils";

function fmtPx(n: number | null | undefined, digits = 3): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

function changeClass(n: number | null | undefined): string {
  if (n == null || n === 0) return "text-muted-foreground";
  return n > 0 ? "text-gain" : "text-loss";
}

function quoteSearchHaystack(row: LiveQuote): string {
  return [row.symbol, row.companyName, row.companyNameAr, row.sector]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

type MoveFilter = "" | "up" | "down" | "flat";

export default function LiveMarket() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [moveFilter, setMoveFilter] = useState<MoveFilter>("");
  const ar = i18n.language?.startsWith("ar");

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["live-status"],
    queryFn: getLiveStatus,
    refetchInterval: 5_000,
  });

  const hasFeed = Boolean(status?.connected || (status?.quoteCount ?? 0) > 0);

  const { data: quotesPayload, isLoading: quotesLoading } = useQuery({
    queryKey: ["live-quotes"],
    queryFn: getLiveQuotes,
    refetchInterval: 3_000,
    enabled: hasFeed,
  });

  const { data: indicesPayload } = useQuery({
    queryKey: ["live-indices"],
    queryFn: getLiveIndices,
    refetchInterval: 5_000,
    enabled: hasFeed,
  });

  const loadMut = useMutation({
    mutationFn: loadLiveSample,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["live-status"] });
      qc.invalidateQueries({ queryKey: ["live-quotes"] });
      qc.invalidateQueries({ queryKey: ["live-indices"] });
    },
  });

  const items = quotesPayload?.items ?? [];
  const exchange = quotesPayload?.exchange ?? status?.exchange ?? null;
  const indices = indicesPayload?.items ?? [];

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const row of items) {
      const s = (row.sector || "").trim();
      if (s) set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((row) => {
      if (needle && !quoteSearchHaystack(row).includes(needle)) return false;
      if (sectorFilter && (row.sector || "") !== sectorFilter) return false;
      const chg = row.netChange ?? 0;
      if (moveFilter === "up" && !(chg > 0)) return false;
      if (moveFilter === "down" && !(chg < 0)) return false;
      if (moveFilter === "flat" && chg !== 0) return false;
      return true;
    });
  }, [items, search, sectorFilter, moveFilter]);

  const resetKey = `${search}\0${sectorFilter}\0${moveFilter}\0${items.length}`;
  const paging = useClientTablePage(filtered, resetKey);
  const filterCount = [sectorFilter, moveFilter].filter(Boolean).length;
  const loading = statusLoading || (hasFeed && quotesLoading && items.length === 0);

  const upCount = items.filter((r) => (r.netChange ?? 0) > 0).length;
  const downCount = items.filter((r) => (r.netChange ?? 0) < 0).length;

  return (
    <Shell>
      <PageHeader
        title={t("live.title")}
        description={t("live.description")}
        meta={(
          <>
            <span className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              status?.connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border/70 text-muted-foreground",
            )}>
              {status?.connected ? t("live.connected") : t("live.disconnected")}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {status?.sessionOpen ? t("live.sessionOpen") : t("live.sessionClosed")}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t(`live.valuation.${status?.valuationSource ?? "official_close"}`)}
            </span>
          </>
        )}
        actions={(
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loadMut.isPending}
            onClick={() => loadMut.mutate()}
          >
            {t("live.loadSample")}
          </Button>
        )}
      />

      <StatsSummaryBar
        className="mb-6"
        loading={statusLoading && !exchange}
        ariaLabel={t("live.summaryAria")}
        items={[
          {
            id: "index",
            icon: "/growth.png",
            label: t("live.summary.index"),
            value: exchange?.currentValue != null
              ? <span className="font-data">{fmtPx(exchange.currentValue, 2)}</span>
              : "—",
            hint: exchange
              ? `${fmtPx(exchange.netChange, 2)}${exchange.netChangePerc != null ? ` (${fmtPx(exchange.netChangePerc, 2)}%)` : ""}`
              : (status?.sessionHoursQatar || "—"),
            valueClassName: changeClass(exchange?.netChange),
          },
          {
            id: "symbols",
            icon: "/analytics.png",
            label: t("live.quotesCount", { count: status?.quoteCount ?? items.length }),
            value: <AnimatedNumber value={status?.quoteCount ?? items.length} format="integer" />,
            hint: t("live.indicesCount", { count: status?.indexCount ?? indices.length }),
          },
          {
            id: "breadth",
            icon: "/apps.png",
            label: t("live.summary.breadth"),
            value: (
              <span className="font-data text-[0.85em]">
                <span className="text-gain">{fmtInt(exchange?.symbolsUp ?? upCount)}</span>
                {" / "}
                <span className="text-loss">{fmtInt(exchange?.symbolsDown ?? downCount)}</span>
              </span>
            ),
            hint: t("live.summary.unchangedHint", {
              count: exchange?.symbolsUnchanged ?? Math.max(0, items.length - upCount - downCount),
            }),
          },
          {
            id: "turnover",
            icon: "/layers.png",
            label: t("live.summary.turnover"),
            value: <span className="font-data">{fmtInt(exchange?.turnOver)}</span>,
            hint: `${t("live.summary.volume")}: ${fmtInt(exchange?.volume)}`,
          },
        ]}
      />

      {indices.length > 0 ? (
        <section className="mb-6">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">
              {t("live.indicesTitle")}
            </h2>
            <span className="text-[12px] font-medium text-[var(--shell-muted)]">
              {t("live.indicesCount", { count: indices.length })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {[...indices]
              .sort((a, b) => {
                const rank = (code: string, name: string) => {
                  if (code === "9999" || /general/i.test(name)) return 0;
                  if (/rayan|islamic/i.test(name)) return 1;
                  if (/all share/i.test(name)) return 2;
                  return 10;
                };
                return rank(a.code, a.nameEn) - rank(b.code, b.nameEn) || a.nameEn.localeCompare(b.nameEn);
              })
              .map((ix) => {
                const label = ar ? ix.nameAr || ix.nameEn : ix.nameEn;
                const chg = ix.change ?? 0;
                return (
                  <article
                    key={ix.code}
                    className="min-w-0 rounded-2xl border border-[#e6ecf7] bg-[linear-gradient(160deg,#ffffff_0%,#f7f9ff_100%)] px-3.5 py-3 shadow-[0_8px_18px_rgba(57,82,143,0.06)] dark:border-white/10 dark:bg-[linear-gradient(160deg,#1a2438_0%,#121a2c_100%)]"
                    title={label}
                  >
                    <p className="truncate text-[11px] font-semibold leading-snug text-[var(--shell-muted)]">
                      {label}
                    </p>
                    <p className="mt-1.5 font-data text-[17px] font-bold tabular-nums leading-none text-[var(--shell-ink)]">
                      {fmtPx(ix.current, 2)}
                    </p>
                    <p className={cn("mt-1.5 font-data text-[11px] font-semibold tabular-nums", changeClass(ix.change))}>
                      {chg > 0 ? "↑ " : chg < 0 ? "↓ " : ""}
                      {fmtPx(ix.change, 2)}
                      {ix.changePerc != null ? (
                        <span className="ms-1 opacity-80">({fmtPx(ix.changePerc, 2)}%)</span>
                      ) : null}
                    </p>
                  </article>
                );
              })}
          </div>
        </section>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon={<Radio className="h-8 w-8 text-muted-foreground" />}
          title={t("live.emptyTitle")}
          description={
            status?.blockedReason
              ? t(`live.reason.${status.blockedReason}`)
              : t("live.emptyHint")
          }
          action={(
            <Button type="button" variant="outline" disabled={loadMut.isPending} onClick={() => loadMut.mutate()}>
              {t("live.loadSample")}
            </Button>
          )}
        />
      ) : (
        <AppTable
          loading={loading || paging.busy}
          footer={<ClientTableFooter paging={paging} />}
          toolbar={(
            <DataTableToolbar
              icon="/analytics.png"
              count={(
                <div className="min-w-0">
                  <span className="block truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">
                    {t("live.watchTitle")}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--shell-muted)]">
                    {t("live.showingCount", { shown: filtered.length, total: items.length })}
                  </span>
                </div>
              )}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("live.searchPlaceholder")}
              searchLabel={t("live.searchPlaceholder")}
              hotkey
              filterLabel={t("customers.filters")}
              filterCount={filterCount}
              filterPanel={(
                <>
                  <div className="grid gap-1">
                    <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                      {t("live.col.sector")}
                    </span>
                    <SelectField
                      className="w-full"
                      contentClassName="clients-select-content"
                      value={sectorFilter}
                      onValueChange={setSectorFilter}
                      aria-label={t("live.col.sector")}
                      options={[
                        { value: "", label: t("common.all") },
                        ...sectors.map((s) => ({ value: s, label: s })),
                      ]}
                    />
                  </div>
                  <div className="grid gap-1">
                    <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                      {t("live.filter.move")}
                    </span>
                    <SelectField
                      className="w-full"
                      contentClassName="clients-select-content"
                      value={moveFilter}
                      onValueChange={(v) => setMoveFilter(v as MoveFilter)}
                      aria-label={t("live.filter.move")}
                      options={[
                        { value: "", label: t("common.all") },
                        { value: "up", label: t("live.filter.up") },
                        { value: "down", label: t("live.filter.down") },
                        { value: "flat", label: t("live.filter.flat") },
                      ]}
                    />
                  </div>
                </>
              )}
            />
          )}
        >
          <TableHeader>
            <TableRow className="clients-thead-row h-10">
              <DataTableHead className="ps-5 min-w-[220px]">{t("common.ticker")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.lastPrice")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.close")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.change")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.changePct")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.bid")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.offer")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.volume")}</DataTableHead>
              <DataTableHead align="end">{t("live.col.value")}</DataTableHead>
              <DataTableHead className="pe-5">{t("live.col.sector")}</DataTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || paging.busy ? (
              <TableSkeletonRows cols={10} rows={paging.pageSize} rowHeight={58} />
            ) : paging.paged.length === 0 ? (
              <DataTableEmpty
                colSpan={10}
                title={t("live.emptyFilterTitle")}
                description={t("live.emptyFilterDesc")}
              />
            ) : (
              paging.paged.map((row) => (
                <TableRow key={row.symbol} className="clients-row">
                  <TableCell className="ps-5">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <CompanyTickerIcon ticker={row.symbol} companyName={row.companyName ?? undefined} />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold leading-tight text-[#0e1837]">{row.symbol}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {ar ? row.companyNameAr || row.companyName : row.companyName || row.companyNameAr}
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-end font-data tabular-nums font-semibold text-amber-700 dark:text-amber-300">
                    {fmtPx(row.lastTradePrice)}
                  </TableCell>
                  <TableCell className="text-end font-data tabular-nums">{fmtPx(row.closePrice)}</TableCell>
                  <TableCell className={cn("text-end font-data tabular-nums", changeClass(row.netChange))}>
                    {fmtPx(row.netChange)}
                  </TableCell>
                  <TableCell className={cn("text-end font-data tabular-nums", changeClass(row.netChangePerc))}>
                    {row.netChangePerc == null ? "—" : `${fmtPx(row.netChangePerc, 2)}%`}
                  </TableCell>
                  <TableCell className="text-end font-data tabular-nums">{fmtPx(row.bidPrice)}</TableCell>
                  <TableCell className="text-end font-data tabular-nums">{fmtPx(row.offerPrice)}</TableCell>
                  <TableCell className="text-end font-data tabular-nums">{fmtInt(row.totalVolume)}</TableCell>
                  <TableCell className="text-end font-data tabular-nums">{fmtInt(row.totalValue)}</TableCell>
                  <TableCell className="max-w-[140px] truncate pe-5 text-xs text-muted-foreground">
                    {row.sector || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AppTable>
      )}

      <p className="mt-6 text-sm text-muted-foreground">{t("live.valuationNote")}</p>
    </Shell>
  );
}
