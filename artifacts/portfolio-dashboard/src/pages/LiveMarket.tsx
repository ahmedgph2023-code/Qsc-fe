import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
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
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  getLiveIndices,
  getLiveQuotes,
  getLiveStatus,
  type LiveQuote,
} from "@/lib/api";
import { CompanyTickerIcon } from "@/components/phase1/CompanyTickerIcon";
import { cn } from "@/lib/utils";

const FLASH_MS = 1200;
const FLASH_CELL = "bg-[#d5dde8] transition-colors duration-300 dark:bg-[#3a4558]";
const LIVE_POLL_MS = 30_000;
const LIVE_PAGE_SIZES = [10, 25, 50, 100, 200];
const COLS = 16;
const TH =
  "sticky top-0 z-[2] whitespace-nowrap bg-[#f4f7fd] dark:bg-[#1a2438]";
const LIVE_QUERY = {
  staleTime: 0,
  refetchInterval: LIVE_POLL_MS,
  refetchIntervalInBackground: true,
  refetchOnWindowFocus: true,
} as const;

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

function changeTone(n: number | null | undefined): string {
  if (n == null || n === 0) return "bg-transparent text-muted-foreground";
  return n > 0
    ? "bg-emerald-500/15 text-gain dark:bg-emerald-500/20"
    : "bg-rose-500/15 text-loss dark:bg-rose-500/20";
}

function quoteSearchHaystack(row: LiveQuote): string {
  return [row.symbol, row.companyName, row.companyNameAr, row.sector]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function displayName(row: Pick<LiveQuote, "companyName" | "companyNameAr">, preferAr: boolean): string {
  const arName = row.companyNameAr?.includes("\uFFFD") ? null : row.companyNameAr;
  const enName = row.companyName?.includes("\uFFFD") ? null : row.companyName;
  if (preferAr) return arName || enName || "—";
  return enName || arName || "—";
}

function displayLabel(ar: string | null | undefined, en: string | null | undefined, preferAr: boolean): string {
  const arOk = ar && !ar.includes("\uFFFD") ? ar : null;
  const enOk = en && !en.includes("\uFFFD") ? en : null;
  if (preferAr) return arOk || enOk || "—";
  return enOk || arOk || "—";
}

function DayRangeBar({
  low,
  high,
  last,
}: {
  low: number | null | undefined;
  high: number | null | undefined;
  last: number;
}) {
  if (low == null || high == null || !(high > low)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const pct = Math.min(100, Math.max(0, ((last - low) / (high - low)) * 100));
  return (
    <div className="mx-auto w-[88px]">
      <div className="relative h-1.5 rounded-full bg-[#e4ebf6] dark:bg-white/10">
        <span
          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--shell-blue)] shadow-sm dark:border-[#1a2438]"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between font-data text-[9px] tabular-nums text-muted-foreground">
        <span>{fmtPx(low, 2)}</span>
        <span>{fmtPx(high, 2)}</span>
      </div>
    </div>
  );
}

type MoveFilter = "" | "up" | "down" | "flat";

export default function LiveMarket() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [moveFilter, setMoveFilter] = useState<MoveFilter>("");
  const [flashUntil, setFlashUntil] = useState<Record<string, number>>({});
  const [, setFlashTick] = useState(0);
  const prevPrices = useRef<Map<string, number>>(new Map());
  const ar = i18n.language?.startsWith("ar");
  const now = Date.now();

  const {
    data: status,
    isLoading: statusLoading,
    dataUpdatedAt: statusUpdatedAt,
  } = useQuery({
    queryKey: ["live-status"],
    queryFn: getLiveStatus,
    ...LIVE_QUERY,
  });

  const hasFeed = Boolean(status?.connected || (status?.quoteCount ?? 0) > 0);

  const {
    data: quotesPayload,
    isLoading: quotesLoading,
    dataUpdatedAt: quotesUpdatedAt,
  } = useQuery({
    queryKey: ["live-quotes"],
    queryFn: getLiveQuotes,
    ...LIVE_QUERY,
    enabled: hasFeed,
  });

  const { data: indicesPayload } = useQuery({
    queryKey: ["live-indices"],
    queryFn: getLiveIndices,
    ...LIVE_QUERY,
    enabled: hasFeed,
  });

  const items = quotesPayload?.items ?? [];
  const exchange = quotesPayload?.exchange ?? status?.exchange ?? null;
  const indices = indicesPayload?.items ?? [];
  const closeLabel = status?.closeSaveLabel ?? "15:05 Asia/Qatar";
  const refreshedAt = Math.max(statusUpdatedAt || 0, quotesUpdatedAt || 0);

  useEffect(() => {
    const next: Record<string, number> = {};
    let any = false;
    for (const row of items) {
      const prev = prevPrices.current.get(row.symbol);
      if (prev != null && prev !== row.lastTradePrice) {
        next[row.symbol] = Date.now() + FLASH_MS;
        any = true;
      }
      prevPrices.current.set(row.symbol, row.lastTradePrice);
    }
    if (any) setFlashUntil((cur) => ({ ...cur, ...next }));
  }, [items]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const t0 = Date.now();
      setFlashUntil((cur) => {
        const keep: Record<string, number> = {};
        for (const [k, v] of Object.entries(cur)) if (v > t0) keep[k] = v;
        return Object.keys(keep).length === Object.keys(cur).length ? cur : keep;
      });
      setFlashTick((n) => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

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

  const resetKey = `${search}\0${sectorFilter}\0${moveFilter}`;
  const paging = useClientTablePage(filtered, resetKey, LIVE_PAGE_SIZES);
  const filterCount = [sectorFilter, moveFilter].filter(Boolean).length;
  const loading = statusLoading || (hasFeed && quotesLoading && items.length === 0);

  const upCount = exchange?.symbolsUp ?? items.filter((r) => (r.netChange ?? 0) > 0).length;
  const downCount = exchange?.symbolsDown ?? items.filter((r) => (r.netChange ?? 0) < 0).length;
  const flatCount =
    exchange?.symbolsUnchanged ?? Math.max(0, items.length - upCount - downCount);
  const breadthTotal = Math.max(1, upCount + downCount + flatCount);
  const primaryIndex = useMemo(() => {
    const ranked = [...indices].sort((a, b) => {
      const rank = (code: string, name: string) => {
        if (code === "9999" || /general/i.test(name)) return 0;
        if (/rayan|islamic/i.test(name)) return 1;
        if (/all share/i.test(name)) return 2;
        return 10;
      };
      return rank(a.code, a.nameEn) - rank(b.code, b.nameEn) || a.nameEn.localeCompare(b.nameEn);
    });
    return ranked[0] ?? null;
  }, [indices]);

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
            <span
              className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground"
              title={t("live.closeSave.info", { time: closeLabel })}
            >
              {t("live.closeSave.at", { time: closeLabel })}
            </span>
            {status?.sampleLoaded ? (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] tracking-wider text-amber-800 dark:text-amber-200">
                {t("live.sampleNote")}
              </span>
            ) : null}
            {status?.lastMessageAt ? (
              <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                {t("live.lastTick")}: {new Date(status.lastMessageAt).toLocaleTimeString()}
              </span>
            ) : null}
            {refreshedAt > 0 ? (
              <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                {t("live.lastRefresh")}: {new Date(refreshedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </>
        )}
      />

      <StatsSummaryBar
        className="mb-4"
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
            id: "turnover",
            icon: "/layers.png",
            label: t("live.summary.turnover"),
            value: <span className="font-data">{fmtInt(exchange?.turnOver)}</span>,
            hint: `${t("live.summary.volume")}: ${fmtInt(exchange?.volume)}`,
          },
          {
            id: "deals",
            icon: "/apps.png",
            label: t("live.summary.deals"),
            value: <AnimatedNumber value={exchange?.totalExecuted ?? 0} format="integer" />,
            hint: t("live.quotesCount", { count: status?.quoteCount ?? items.length }),
          },
          {
            id: "breadth",
            icon: "/chart.png",
            label: t("live.summary.breadth"),
            value: (
              <span className="font-data text-[0.85em]">
                <span className="text-gain">{fmtInt(upCount)}</span>
                {" / "}
                <span className="text-loss">{fmtInt(downCount)}</span>
              </span>
            ),
            hint: t("live.summary.unchangedHint", { count: flatCount }),
          },
        ]}
      />

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start">
        <aside className="flex w-full shrink-0 flex-col gap-3 xl:sticky xl:top-3 xl:h-[calc(95vh-var(--shell-header-h)-1.5rem)] xl:w-[280px]">
          <article className="shrink-0 rounded-2xl border border-[#e6ecf7] bg-[linear-gradient(160deg,#ffffff_0%,#f7f9ff_100%)] p-4 shadow-[0_8px_18px_rgba(57,82,143,0.06)] dark:border-white/10 dark:bg-[linear-gradient(160deg,#1a2438_0%,#121a2c_100%)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
              {t("live.summary.panelTitle")}
            </p>
            <p className="mt-2 truncate text-[13px] font-semibold text-[var(--shell-ink)]">
              {displayLabel(
                exchange?.nameAr || primaryIndex?.nameAr,
                exchange?.nameEn || primaryIndex?.nameEn,
                ar,
              )}
            </p>
            <p className="mt-2 font-data text-[28px] font-bold tabular-nums leading-none text-[var(--shell-ink)]">
              {fmtPx(exchange?.currentValue ?? primaryIndex?.current, 2)}
            </p>
            <p className={cn("mt-2 font-data text-[13px] font-semibold tabular-nums", changeClass(exchange?.netChange ?? primaryIndex?.change))}>
              {(exchange?.netChange ?? primaryIndex?.change ?? 0) > 0 ? "↑ " : (exchange?.netChange ?? primaryIndex?.change ?? 0) < 0 ? "↓ " : ""}
              {fmtPx(exchange?.netChange ?? primaryIndex?.change, 2)}
              {(exchange?.netChangePerc ?? primaryIndex?.changePerc) != null ? (
                <span className="ms-1 opacity-80">
                  ({fmtPx(exchange?.netChangePerc ?? primaryIndex?.changePerc, 2)}%)
                </span>
              ) : null}
            </p>
            <div className="mt-4 rounded-xl bg-white/70 px-3 py-2.5 dark:bg-black/20">
              <p className="text-[11px] text-[var(--shell-muted)]">{t("live.summary.deals")}</p>
              <p className="mt-0.5 font-data text-[16px] font-bold tabular-nums">{fmtInt(exchange?.totalExecuted)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {t("live.summary.turnover")}: {fmtInt(exchange?.turnOver)}
              </p>
            </div>
          </article>

          <article className="shrink-0 rounded-2xl border border-[#e6ecf7] bg-white p-4 dark:border-white/10 dark:bg-[#121a2c]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
              {t("live.summary.breadth")}
            </p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-[#e8eef8] dark:bg-white/10">
              <span className="bg-emerald-500" style={{ width: `${(upCount / breadthTotal) * 100}%` }} />
              <span className="bg-amber-400" style={{ width: `${(flatCount / breadthTotal) * 100}%` }} />
              <span className="bg-rose-500" style={{ width: `${(downCount / breadthTotal) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <p className="font-data text-[15px] font-bold text-gain">{fmtInt(upCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.up")}</p>
              </div>
              <div>
                <p className="font-data text-[15px] font-bold text-amber-600 dark:text-amber-300">{fmtInt(flatCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.flat")}</p>
              </div>
              <div>
                <p className="font-data text-[15px] font-bold text-loss">{fmtInt(downCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.down")}</p>
              </div>
            </div>
          </article>

          {indices.length > 0 ? (
            <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#e6ecf7] bg-white pt-3 ps-3 dark:border-white/10 dark:bg-[#121a2c]">
              <p className="mb-2 shrink-0 pe-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                {t("live.indicesTitle")}
              </p>
              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-2">
                {[...indices]
                  .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
                  .map((ix) => {
                    const label = displayLabel(ix.nameAr, ix.nameEn, ar);
                    return (
                      <div
                        key={ix.code}
                        className="flex items-center justify-between gap-2 rounded-xl py-1.5 pe-2 ps-2 hover:bg-[#f4f7fd] dark:hover:bg-white/5"
                      >
                        <span className="min-w-0 truncate text-[11px] font-semibold text-[var(--shell-ink)]">{label}</span>
                        <span className="shrink-0 text-end">
                          <span className="block font-data text-[12px] font-bold tabular-nums">{fmtPx(ix.current, 2)}</span>
                          <span className={cn("font-data text-[10px] font-semibold tabular-nums", changeClass(ix.change))}>
                            {fmtPx(ix.changePerc, 2)}%
                          </span>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </article>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1">
          {!loading && items.length === 0 ? (
            <EmptyState
              icon={<Radio className="h-8 w-8 text-muted-foreground" />}
              title={t("live.emptyTitle")}
              description={
                status?.blockedReason
                  ? t(`live.reason.${status.blockedReason}`)
                  : t("live.emptyHint")
              }
            />
          ) : (
            <AppTable
              loading={loading || paging.busy}
              className="flex max-h-[calc(95vh-var(--shell-header-h))] flex-col overflow-hidden"
              wrapClassName="clients-table-wrap min-h-0 flex-1 overflow-auto"
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
                  <DataTableHead className={cn(TH, "ps-4 min-w-[200px]")}>{t("common.ticker")}</DataTableHead>
                  <DataTableHead className={cn(TH, "min-w-[180px]")}>{t("live.col.name")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.close")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.open")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.high")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.low")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.lastPrice")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.change")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.changePct")}</DataTableHead>
                  <DataTableHead className={cn(TH, "text-center")}>{t("live.col.range")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.bid")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.bidVol")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.offer")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.offerVol")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.volume")}</DataTableHead>
                  <DataTableHead align="end" className={cn(TH, "pe-4")}>{t("live.col.value")}</DataTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || paging.busy ? (
                  <TableSkeletonRows cols={COLS} rows={Math.min(paging.pageSize, 12)} rowHeight={56} />
                ) : paging.paged.length === 0 ? (
                  <DataTableEmpty
                    colSpan={COLS}
                    title={t("live.emptyFilterTitle")}
                    description={t("live.emptyFilterDesc")}
                  />
                ) : (
                  paging.paged.map((row) => {
                    const flashing = (flashUntil[row.symbol] ?? 0) > now;
                    const name = displayName(row, ar);
                    return (
                      <TableRow key={row.symbol} className="clients-row">
                        <TableCell className="ps-4">
                          <span className="inline-flex min-w-0 items-center gap-2.5">
                            <CompanyTickerIcon
                              ticker={row.symbol}
                              companyName={row.companyName ?? undefined}
                              className="size-9 rounded-full"
                            />
                            <span className="font-data text-[13px] font-bold tracking-tight text-[var(--shell-ink)]">
                              {row.symbol}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="min-w-[180px] max-w-[240px] text-[12px] text-muted-foreground" title={name}>
                          <span className="line-clamp-2 whitespace-normal break-words">{name}</span>
                        </TableCell>
                        <TableCell className="text-end font-data text-[12px] tabular-nums font-medium">
                          {fmtPx(row.closePrice)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[12px] tabular-nums font-medium">
                          {fmtPx(row.openPrice)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[12px] tabular-nums font-medium text-gain">
                          {fmtPx(row.highPrice)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[12px] tabular-nums font-medium text-loss">
                          {fmtPx(row.lowPrice)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-end font-data text-[14px] font-bold tabular-nums tracking-tight",
                            flashing ? FLASH_CELL : changeTone(row.netChange),
                          )}
                        >
                          {fmtPx(row.lastTradePrice)}
                        </TableCell>
                        <TableCell className={cn("text-end font-data text-[12px] tabular-nums font-semibold", changeTone(row.netChange), flashing && FLASH_CELL)}>
                          {fmtPx(row.netChange)}
                        </TableCell>
                        <TableCell className={cn("text-end font-data text-[12px] tabular-nums font-semibold", changeTone(row.netChangePerc), flashing && FLASH_CELL)}>
                          {row.netChangePerc == null ? "—" : `${fmtPx(row.netChangePerc, 2)}%`}
                        </TableCell>
                        <TableCell>
                          <DayRangeBar low={row.lowPrice} high={row.highPrice} last={row.lastTradePrice} />
                        </TableCell>
                        <TableCell className={cn("text-end font-data text-[12px] tabular-nums font-medium", flashing && FLASH_CELL)}>
                          {fmtPx(row.bidPrice)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[11px] tabular-nums text-muted-foreground">
                          {fmtInt(row.bidVolume)}
                        </TableCell>
                        <TableCell className={cn("text-end font-data text-[12px] tabular-nums font-medium", flashing && FLASH_CELL)}>
                          {fmtPx(row.offerPrice)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[11px] tabular-nums text-muted-foreground">
                          {fmtInt(row.offerVolume)}
                        </TableCell>
                        <TableCell className="text-end font-data text-[12px] tabular-nums font-medium">
                          {fmtInt(row.totalVolume)}
                        </TableCell>
                        <TableCell className="pe-4 text-end font-data text-[12px] tabular-nums font-medium">
                          {fmtInt(row.totalValue)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </AppTable>
          )}
        </div>
      </div>
 
    </Shell>
  );
}
