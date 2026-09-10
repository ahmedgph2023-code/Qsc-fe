import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState, TableSkeletonRows } from "@/components/phase1/PageHeader";
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
/** Pulse Last only — do not grey Bid/Offer (that looked like a broken hover blotch). */
const FLASH_LAST = "ring-2 ring-inset ring-white/80 brightness-110 transition-[filter,box-shadow] duration-300";
const LIVE_POLL_MS = 500;
const LIVE_PAGE_SIZES = [10, 25, 50, 100, 200];
const COLS = 13;
const TH =
  "sticky top-0 z-[2] whitespace-nowrap !bg-[#1e3a5f] text-[10px] font-bold uppercase tracking-wider !text-white dark:!bg-[#0f1c2e]";
const BID_CELL = "!bg-[#cfe2ff] text-[#0b3d91] dark:!bg-[#1e3a5f] dark:text-[#9ec5ff]";
const OFFER_CELL = "!bg-[#f0d78c] text-[#5c4200] dark:!bg-[#4a3b12] dark:text-[#f0d78c]";
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

/** Client / QSE rule: Last vs Previous Close. */
function moveFromLastClose(last: number, close: number | null | undefined): number {
  if (close == null || !Number.isFinite(close)) return 0;
  const d = last - close;
  if (Math.abs(d) < 1e-9) return 0;
  return d > 0 ? 1 : -1;
}

/** QSE-style solid Last Price cell (! keeps fill on row hover). */
function lastPriceTone(dir: number): string {
  if (dir > 0) return "!bg-[#16a34a] !text-white font-bold";
  if (dir < 0) return "!bg-[#dc2626] !text-white font-bold";
  return "!bg-[#e5e7eb] !text-[#374151] font-bold dark:!bg-white/15 dark:!text-foreground";
}

function changeTone(dir: number): string {
  if (dir > 0) return "!bg-emerald-500/15 text-gain font-semibold";
  if (dir < 0) return "!bg-rose-500/15 text-loss font-semibold";
  return "!bg-[#e8eaed] text-muted-foreground dark:!bg-white/10";
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

function displayName(row: Pick<LiveQuote, "companyName" | "companyNameAr">, preferAr: boolean): string {
  const arName = row.companyNameAr?.includes("\uFFFD") ? null : row.companyNameAr;
  const enName = row.companyName?.includes("\uFFFD") ? null : row.companyName;
  if (preferAr) return arName || enName || "—";
  return enName || arName || "—";
}

function displayLabel(arName: string | null | undefined, en: string | null | undefined, preferAr: boolean): string {
  const arOk = arName && !arName.includes("\uFFFD") ? arName : null;
  const enOk = en && !en.includes("\uFFFD") ? en : null;
  if (preferAr) return arOk || enOk || "—";
  return enOk || arOk || "—";
}

type MoveFilter = "" | "up" | "down" | "flat";

function DetailStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-2 border-b border-[#e8eef8] py-1 last:border-b-0 dark:border-white/10">
      <p className="shrink-0 text-[9px] font-medium uppercase tracking-[0.03em] text-[var(--shell-muted)]">{label}</p>
      <p className={cn("min-w-0 truncate text-end font-data text-[11px] font-bold tabular-nums text-[var(--shell-ink)]", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

const LIVE_PANEL_H = "calc(100vh - 80px)";

export default function LiveMarket() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [moveFilter, setMoveFilter] = useState<MoveFilter>("");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
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
      const dir = moveFromLastClose(row.lastTradePrice, row.closePrice);
      if (moveFilter === "up" && !(dir > 0)) return false;
      if (moveFilter === "down" && !(dir < 0)) return false;
      if (moveFilter === "flat" && dir !== 0) return false;
      return true;
    });
  }, [items, search, sectorFilter, moveFilter]);

  const resetKey = `${search}\0${sectorFilter}\0${moveFilter}`;
  const paging = useClientTablePage(filtered, resetKey, LIVE_PAGE_SIZES);
  const filterCount = [sectorFilter, moveFilter].filter(Boolean).length;
  const loading = statusLoading || (hasFeed && quotesLoading && items.length === 0);

  const selected = useMemo(
    () => (selectedSymbol ? items.find((r) => r.symbol === selectedSymbol) ?? null : null),
    [items, selectedSymbol],
  );

  useEffect(() => {
    if (selectedSymbol && items.length > 0 && !items.some((r) => r.symbol === selectedSymbol)) {
      setSelectedSymbol(null);
    }
  }, [items, selectedSymbol]);

  const upCount = useMemo(
    () => items.filter((r) => moveFromLastClose(r.lastTradePrice, r.closePrice) > 0).length,
    [items],
  );
  const downCount = useMemo(
    () => items.filter((r) => moveFromLastClose(r.lastTradePrice, r.closePrice) < 0).length,
    [items],
  );
  const flatCount = Math.max(0, items.length - upCount - downCount);
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

  const indexValue = exchange?.currentValue ?? primaryIndex?.current ?? null;
  const indexChg = exchange?.netChange ?? primaryIndex?.change ?? null;
  const indexChgPct = exchange?.netChangePerc ?? primaryIndex?.changePerc ?? null;

  return (
    <Shell>
      <PageHeader
        title={t("live.title")}
        eyebrowClassName='flex items-center justify-between flex-wrap'
        // description={t("live.description")}
        meta={(
          <>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              status?.sessionOpen
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            )}>
              <span className={cn("size-1.5 rounded-full", status?.sessionOpen ? "bg-emerald-500" : "bg-rose-500")} />
              {status?.sessionOpen ? t("live.sessionOpen") : t("live.sessionClosed")}
            </span>
            <span className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              status?.connected
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border/70 text-muted-foreground",
            )}>
              {status?.connected ? t("live.connected") : t("live.disconnected")}
            </span>
            <span
              className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground"
              title={t("live.closeSave.info", { time: closeLabel })}
            >
              {t("live.closeSave.at", { time: closeLabel })}
            </span>
            {refreshedAt > 0 ? (
              <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] tracking-wider text-muted-foreground">
                {t("live.lastRefresh")}: {new Date(refreshedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </>
        )}
      />

      {!status?.connected && status?.feedSource === "sample" && hasFeed ? (
        <div
          className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-[12px] leading-snug text-amber-950 dark:text-amber-100"
          role="status"
        >
          {t("live.sampleNote")}
        </div>
      ) : null}
      {/* {status?.feedSource === "qse_public" ? (
        <div
          className="mb-4 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2.5 text-[12px] leading-snug text-sky-950 dark:text-sky-100"
          role="status"
        >
          {t("live.qsePublicNote")}
        </div>
      ) : null} */}

      {/* QSE-style top market strip */}
      <section
        className="mb-4 overflow-hidden rounded-2xl border border-[#d0dbeb] bg-white shadow-[0_8px_18px_rgba(57,82,143,0.06)] dark:border-white/10 dark:bg-[#121a2c]"
        aria-label={t("live.summaryAria")}
      >
        <div className="grid grid-cols-2 divide-x divide-[#e6ecf7] dark:divide-white/10 lg:grid-cols-5">
          <div className="col-span-2 flex flex-col justify-center gap-1 px-4 py-3 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--shell-muted)]">
              {t("live.summary.index")}
            </p>
            <p className="font-data text-[26px] font-bold tabular-nums leading-none text-[var(--shell-ink)]">
              {statusLoading && indexValue == null ? "…" : fmtPx(indexValue, 2)}
            </p>
            <p className={cn("font-data text-[12px] font-semibold tabular-nums", changeClass(indexChg))}>
              {(indexChg ?? 0) > 0 ? "↑ " : (indexChg ?? 0) < 0 ? "↓ " : ""}
              {fmtPx(indexChg, 2)}
              {indexChgPct != null ? ` (${fmtPx(indexChgPct, 2)}%)` : ""}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--shell-muted)]">
              {t("live.summary.deals")}
            </p>
            <p className="font-data text-[20px] font-bold tabular-nums text-[var(--shell-ink)]">
              {fmtInt(exchange?.totalExecuted)}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--shell-muted)]">
              {t("live.summary.volume")}
            </p>
            <p className="font-data text-[20px] font-bold tabular-nums text-[var(--shell-ink)]">
              {fmtInt(exchange?.volume)}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--shell-muted)]">
              {t("live.summary.turnover")}
            </p>
            <p className="font-data text-[20px] font-bold tabular-nums text-[var(--shell-ink)]">
              {fmtInt(exchange?.turnOver)}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--shell-muted)]">
              {t("live.summary.breadth")}
            </p>
            <p className="font-data text-[18px] font-bold tabular-nums">
              <span className="text-gain">{fmtInt(upCount)}</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-loss">{fmtInt(downCount)}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              {t("live.summary.unchangedHint", { count: flatCount })}
            </p>
          </div>
        </div>
      </section>

      {/* Table left · sidebar right (QSE) */}
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 order-2 xl:order-1">
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
              className="live-mw-table flex max-h-[calc(100vh-100px)] flex-col overflow-hidden"
              style={{ maxHeight: LIVE_PANEL_H }}
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
                <TableRow className="clients-thead-row h-10 hover:bg-transparent">
                  <DataTableHead className={cn(TH, "ps-3")}>{t("common.ticker")}</DataTableHead>
                  <DataTableHead className={cn(TH, "min-w-[120px]")}>{t("live.col.name")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.close")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.offerVol")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.offer")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.lastPrice")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.bid")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.bidVol")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.trades")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.volume")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.value")}</DataTableHead>
                  <DataTableHead align="end" className={TH}>{t("live.col.change")}</DataTableHead>
                  <DataTableHead align="end" className={cn(TH, "pe-3")}>{t("live.col.changePct")}</DataTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || paging.busy ? (
                  <TableSkeletonRows cols={COLS} rows={Math.min(paging.pageSize, 14)} rowHeight={48} />
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
                    const dir = moveFromLastClose(row.lastTradePrice, row.closePrice);
                    const lastTone = lastPriceTone(dir);
                    const chgTone = changeTone(dir);
                    const isSelected = selectedSymbol === row.symbol;
                    const changeVal =
                      row.netChange ??
                      (row.closePrice != null ? row.lastTradePrice - row.closePrice : null);
                    const changePct =
                      row.netChangePerc ??
                      (row.closePrice != null && row.closePrice > 0 && changeVal != null
                        ? (changeVal / row.closePrice) * 100
                        : null);
                    return (
                      <TableRow
                        key={row.symbol}
                        data-selected={isSelected ? "true" : undefined}
                        className="clients-row h-11 cursor-pointer"
                        onClick={() =>
                          setSelectedSymbol((cur) => (cur === row.symbol ? null : row.symbol))
                        }
                      >
                        <TableCell className="ps-3 py-1.5">
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <CompanyTickerIcon
                              ticker={row.symbol}
                              companyName={row.companyName ?? undefined}
                              className="size-7 rounded-full"
                            />
                            <span className="font-data text-[12px] font-bold tracking-tight text-[var(--shell-ink)]">
                              {row.symbol}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate py-1.5 text-[11px] text-muted-foreground" title={name}>
                          {name}
                        </TableCell>
                        <TableCell className="py-1.5 text-end font-data text-[12px] tabular-nums font-medium">
                          {fmtPx(row.closePrice)}
                        </TableCell>
                        <TableCell data-mw-tone="offer" className={cn("py-1.5 text-end font-data text-[11px] tabular-nums font-medium", OFFER_CELL)}>
                          {fmtInt(row.offerVolume)}
                        </TableCell>
                        <TableCell data-mw-tone="offer" className={cn("py-1.5 text-end font-data text-[12px] tabular-nums font-bold", OFFER_CELL)}>
                          {fmtPx(row.offerPrice)}
                        </TableCell>
                        <TableCell
                          data-mw-tone="last"
                          className={cn("py-1.5 text-end font-data text-[13px] tabular-nums", lastTone, flashing && FLASH_LAST)}
                        >
                          {fmtPx(row.lastTradePrice)}
                        </TableCell>
                        <TableCell data-mw-tone="bid" className={cn("py-1.5 text-end font-data text-[12px] tabular-nums font-bold", BID_CELL)}>
                          {fmtPx(row.bidPrice)}
                        </TableCell>
                        <TableCell data-mw-tone="bid" className={cn("py-1.5 text-end font-data text-[11px] tabular-nums font-medium", BID_CELL)}>
                          {fmtInt(row.bidVolume)}
                        </TableCell>
                        <TableCell className="py-1.5 text-end font-data text-[11px] tabular-nums font-medium">
                          {fmtInt(row.trades)}
                        </TableCell>
                        <TableCell className="py-1.5 text-end font-data text-[11px] tabular-nums font-medium">
                          {fmtInt(row.totalVolume)}
                        </TableCell>
                        <TableCell className="py-1.5 text-end font-data text-[11px] tabular-nums font-medium">
                          {fmtInt(row.totalValue)}
                        </TableCell>
                        <TableCell data-mw-tone="chg" className={cn("py-1.5 text-end font-data text-[12px] tabular-nums", chgTone)}>
                          {fmtPx(changeVal)}
                        </TableCell>
                        <TableCell data-mw-tone="chg" className={cn("pe-3 py-1.5 text-end font-data text-[12px] tabular-nums", chgTone)}>
                          {changePct == null ? "—" : `${fmtPx(changePct, 2)}%`}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </AppTable>
          )}
        </div>

        <aside
          className="order-1 flex w-full shrink-0 flex-col gap-2 overflow-y-auto xl:sticky xl:top-3 xl:order-2 xl:w-[300px]"
          style={{ maxHeight: LIVE_PANEL_H }}
        >
          {selected ? (
            <article className="shrink-0 rounded-xl border border-[#2563eb]/35 bg-white px-3 py-2.5 dark:border-blue-400/30 dark:bg-[#121a2c]">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--shell-muted)]">
                  {t("live.detail.title")}
                </p>
                <button
                  type="button"
                  className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--shell-muted)] hover:bg-[#eef3fb] hover:text-[var(--shell-ink)] dark:hover:bg-white/10"
                  onClick={() => setSelectedSymbol(null)}
                >
                  {t("live.detail.clear")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <CompanyTickerIcon
                  ticker={selected.symbol}
                  companyName={selected.companyName ?? undefined}
                  className="size-8 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-data text-[13px] font-bold tracking-tight text-[var(--shell-ink)]">
                    {selected.symbol}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground" title={displayName(selected, ar)}>
                    {displayName(selected, ar)}
                  </p>
                </div>
              </div>
              {(() => {
                const dir = moveFromLastClose(selected.lastTradePrice, selected.closePrice);
                const changeVal =
                  selected.netChange ??
                  (selected.closePrice != null ? selected.lastTradePrice - selected.closePrice : null);
                const changePct =
                  selected.netChangePerc ??
                  (selected.closePrice != null && selected.closePrice > 0 && changeVal != null
                    ? (changeVal / selected.closePrice) * 100
                    : null);
                return (
                  <>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className={cn(
                        "rounded-md px-2 py-0.5 font-data text-[18px] font-bold tabular-nums leading-none",
                        lastPriceTone(dir),
                      )}>
                        {fmtPx(selected.lastTradePrice)}
                      </p>
                      <div className="text-end leading-tight">
                        <p className={cn("font-data text-[12px] font-bold tabular-nums", changeClass(changeVal))}>
                          {(changeVal ?? 0) > 0 ? "+" : ""}
                          {fmtPx(changeVal)}
                        </p>
                        <p className={cn("font-data text-[10px] font-semibold tabular-nums", changeClass(changePct))}>
                          {changePct == null ? "—" : `${fmtPx(changePct, 2)}%`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <DetailStat label={t("live.col.close")} value={fmtPx(selected.closePrice)} />
                      <DetailStat label={t("live.col.open")} value={fmtPx(selected.openPrice)} />
                      <DetailStat label={t("live.col.high")} value={fmtPx(selected.highPrice)} />
                      <DetailStat label={t("live.col.low")} value={fmtPx(selected.lowPrice)} />
                      <DetailStat
                        label={t("live.col.bid")}
                        value={`${fmtPx(selected.bidPrice)} · ${fmtInt(selected.bidVolume)}`}
                        valueClassName="text-[#0b3d91] dark:text-[#9ec5ff]"
                      />
                      <DetailStat
                        label={t("live.col.offer")}
                        value={`${fmtPx(selected.offerPrice)} · ${fmtInt(selected.offerVolume)}`}
                        valueClassName="text-[#5c4200] dark:text-[#f0d78c]"
                      />
                      <DetailStat label={t("live.col.trades")} value={fmtInt(selected.trades)} />
                      <DetailStat label={t("live.col.volume")} value={fmtInt(selected.totalVolume)} />
                      <DetailStat label={t("live.col.value")} value={fmtInt(selected.totalValue)} />
                      <DetailStat label={t("live.detail.lastTradeVol")} value={fmtInt(selected.lastTradeVolume)} />
                    </div>
                    {selected.updatedAt ? (
                      <p className="mt-1.5 text-[9px] text-muted-foreground">
                        {t("live.detail.updated")}:{" "}
                        <span className="font-data tabular-nums">
                          {Number.isNaN(Date.parse(selected.updatedAt))
                            ? selected.updatedAt
                            : new Date(selected.updatedAt).toLocaleTimeString()}
                        </span>
                      </p>
                    ) : null}
                  </>
                );
              })()}
            </article>
          ) : (
            <article className="shrink-0 rounded-xl border border-dashed border-[#d0dbeb] bg-white/70 px-3 py-2 dark:border-white/15 dark:bg-[#121a2c]/70">
              <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--shell-muted)]">
                {t("live.detail.title")}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t("live.detail.hint")}</p>
            </article>
          )}

          <article className="shrink-0 rounded-xl border border-[#d0dbeb] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#121a2c]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--shell-muted)]">
                {t("live.summary.panelTitle")}
              </p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase",
                status?.sessionOpen
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
              )}>
                <span className={cn("size-1.5 rounded-full", status?.sessionOpen ? "bg-emerald-500" : "bg-rose-500")} />
                {status?.sessionOpen ? t("live.sessionOpen") : t("live.sessionClosed")}
              </span>
            </div>
            <p className="truncate text-[11px] font-semibold text-[var(--shell-ink)]">
              {displayLabel(
                exchange?.nameAr || primaryIndex?.nameAr,
                exchange?.nameEn || primaryIndex?.nameEn || "QE Index",
                ar,
              )}
            </p>
            <p className="mt-1 font-data text-[20px] font-bold tabular-nums leading-none text-[var(--shell-ink)]">
              {fmtPx(indexValue, 2)}
            </p>
            <p className={cn("mt-1 font-data text-[11px] font-semibold tabular-nums", changeClass(indexChg))}>
              {(indexChg ?? 0) > 0 ? "↑ " : (indexChg ?? 0) < 0 ? "↓ " : ""}
              {fmtPx(indexChg, 2)}
              {indexChgPct != null ? (
                <span className="ms-1 opacity-80">({fmtPx(indexChgPct, 2)}%)</span>
              ) : null}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="rounded-lg bg-[#f4f7fd] px-2 py-1.5 dark:bg-black/20">
                <p className="text-[var(--shell-muted)]">{t("live.summary.deals")}</p>
                <p className="mt-0.5 font-data text-[12px] font-bold tabular-nums">{fmtInt(exchange?.totalExecuted)}</p>
              </div>
              <div className="rounded-lg bg-[#f4f7fd] px-2 py-1.5 dark:bg-black/20">
                <p className="text-[var(--shell-muted)]">{t("live.summary.volume")}</p>
                <p className="mt-0.5 font-data text-[12px] font-bold tabular-nums">{fmtInt(exchange?.volume)}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-[#f4f7fd] px-2 py-1.5 dark:bg-black/20">
                <p className="text-[var(--shell-muted)]">{t("live.summary.turnover")}</p>
                <p className="mt-0.5 font-data text-[12px] font-bold tabular-nums">{fmtInt(exchange?.turnOver)}</p>
              </div>
            </div>
          </article>

          <article className="shrink-0 rounded-2xl border border-[#d0dbeb] bg-white p-4 dark:border-white/10 dark:bg-[#121a2c]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
              {t("live.summary.breadth")}
            </p>
            <div className="flex h-3 overflow-hidden rounded-full bg-[#e8eef8] dark:bg-white/10">
              <span className="bg-[#16a34a]" style={{ width: `${(upCount / breadthTotal) * 100}%` }} />
              <span className="bg-amber-400" style={{ width: `${(flatCount / breadthTotal) * 100}%` }} />
              <span className="bg-[#dc2626]" style={{ width: `${(downCount / breadthTotal) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <p className="font-data text-[16px] font-bold text-gain">{fmtInt(upCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.up")}</p>
              </div>
              <div>
                <p className="font-data text-[16px] font-bold text-amber-600 dark:text-amber-300">{fmtInt(flatCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.flat")}</p>
              </div>
              <div>
                <p className="font-data text-[16px] font-bold text-loss">{fmtInt(downCount)}</p>
                <p className="text-muted-foreground">{t("live.filter.down")}</p>
              </div>
            </div>
          </article>

          {indices.length > 0 ? (
            <article className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#d0dbeb] bg-white pt-3 ps-3 dark:border-white/10 dark:bg-[#121a2c]">
              <p className="mb-2 shrink-0 pe-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                {t("live.indicesTitle")}
              </p>
              <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
                {[...indices]
                  .sort((a, b) => a.nameEn.localeCompare(b.nameEn))
                  .map((ix) => {
                    const label = displayLabel(ix.nameAr, ix.nameEn, ar);
                    return (
                      <div
                        key={ix.code}
                        className="flex items-center justify-between gap-2 rounded-lg py-1.5 pe-2 ps-2 hover:bg-[#f4f7fd] dark:hover:bg-white/5"
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
      </div>
    </Shell>
  );
}
