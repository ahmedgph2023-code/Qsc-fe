import { useMemo, useState, useDeferredValue, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "wouter";
import { ChevronDown, Filter, Search } from "lucide-react";
import type { Holding } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SelectField } from "@/components/phase1/SelectField";
import { SourceHint } from "@/components/phase1/SourceHint";
import { TableSkeletonRows } from "@/components/phase1/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SECTOR_TONES = ["#1f58e9", "#8551d8", "#18a270", "#11a3b0", "#e98921", "#315bc6", "#e24b57", "#c5cedf"];
const CASH_KEY = "Cash";

export type SectorAlloc = { sector: string; value: number; weight: number };

type Props = {
  formatCurrency: (n: number) => string;
  holdings: Holding[];
  cashBal: number;
  cashWeight: number | null | undefined;
  cashOpenedOn?: string | null;
  cashHoldingDays?: number | null;
  navWeightByStock: Map<string, number | undefined>;
  sectors: SectorAlloc[];
  dailyChanges?: Array<{ date: string; nav: number; chgQar: number | null; chgPct: number | null }>;
  loading?: boolean;
  portfolioId: string;
  showSourceHints?: boolean;
};

const TABLE_COLS = 16;

function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-full w-full rounded-xl", className)} />;
}

function formatBuyingDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso.slice(0, 10);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

type PlFilter = "" | "gain" | "loss";

function formatSignedPct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatNavWeight(weight: number | undefined) {
  if (weight == null || Number.isNaN(weight)) return "—";
  return `${(weight * 100).toFixed(2)}%`;
}

function heatmapClass(pct: number | null | undefined) {
  if (pct == null || Number.isNaN(pct)) return "text-muted-foreground";
  if (pct <= -10) return "bg-red-500/15 text-loss font-semibold";
  if (pct < 0) return "bg-red-500/10 text-loss";
  if (pct < 5) return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
  if (pct < 15) return "bg-emerald-500/10 text-gain";
  return "bg-emerald-500/20 text-gain font-semibold";
}

function PlDot({ value }: { value: number }) {
  const tone = Math.abs(value) < 0.005 ? "bg-slate-400" : value > 0 ? "bg-emerald-500" : "bg-red-500";
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full shadow-sm", tone)} aria-hidden />;
}

function WeightBar({ weight }: { weight: number | null | undefined }) {
  const pct = weight == null ? 0 : Math.max(0, Math.min(100, weight * 100));
  return (
    <div className="ms-auto flex min-w-[5rem] items-center justify-start gap-2">
      <div className="relative h-2 w-16 overflow-hidden rounded-full bg-[#e8eefc] dark:bg-muted">
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-[linear-gradient(90deg,#315bc6,#1f58e9)] rtl:bg-[linear-gradient(270deg,#315bc6,#1f58e9)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-data text-xs tabular-nums cdp-col-wt">{formatNavWeight(weight ?? undefined)}</span>
    </div>
  );
}

function HintHead({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <TableHead className={cn("text-start text-nowrap", className)}>
      <span className="inline-flex w-full items-center justify-start gap-1 text-nowrap">
        {children}
        {hint ? <SourceHint text={hint} className="size-5 border-0 bg-transparent shadow-none" /> : null}
      </span>
    </TableHead>
  );
}

function PanelTitle({
  id,
  title,
  hint,
}: {
  id?: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="cdp-sectors-head mb-3 flex shrink-0 items-start justify-between gap-2 text-start">
      <div>
        <h3 id={id}>{title}</h3>
      </div>
      {hint ? <SourceHint text={hint} /> : null}
    </header>
  );
}

export function HistoricalPortfolioDashboard({
  formatCurrency,
  holdings,
  cashBal,
  cashWeight,
  cashOpenedOn,
  cashHoldingDays,
  navWeightByStock,
  sectors,
  dailyChanges = [],
  loading,
  portfolioId,
  showSourceHints = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const dir = i18n.dir();
  const cashLabel = t("historicalPortfolio.cash");
  const src = (key: string) => (showSourceHints ? t(`historicalPortfolio.source.${key}`) : undefined);

  const tickers = useMemo(() => {
    const list = holdings.map((h) => h.ticker).sort((a, b) => a.localeCompare(b));
    if (Math.abs(cashBal) >= 0.0001) list.push(CASH_KEY);
    return list;
  }, [holdings, cashBal]);

  const sectorOptions = useMemo(() => {
    const set = new Set(holdings.map((h) => h.sector).filter(Boolean));
    if (Math.abs(cashBal) >= 0.0001) set.add(CASH_KEY);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [holdings, cashBal]);

  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sectorFilter, setSectorFilter] = useState("");
  const [plFilter, setPlFilter] = useState<PlFilter>("");

  const active = selected ?? new Set(tickers);
  const allSelected = tickers.length > 0 && tickers.every((tkr) => active.has(tkr));
  const selectedCount = tickers.filter((tkr) => active.has(tkr)).length;

  const toggle = (ticker: string) => {
    setSelected((prev) => {
      const base = new Set(prev ?? tickers);
      if (base.has(ticker)) base.delete(ticker);
      else base.add(ticker);
      return base;
    });
  };

  const clearFilters = () => {
    setSelected(null);
    setSearch("");
    setSectorFilter("");
    setPlFilter("");
  };

  const hasActiveFilters = !!(search || sectorFilter || plFilter || (selected != null && !allSelected));

  const filteredHoldings = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    return holdings
      .filter((h) => active.has(h.ticker))
      .filter((h) => !sectorFilter || h.sector === sectorFilter)
      .filter((h) => {
        if (plFilter === "gain") return h.gainLossValue > 0;
        if (plFilter === "loss") return h.gainLossValue < 0;
        return true;
      })
      .filter((h) => {
        if (!q) return true;
        return (
          h.ticker.toLowerCase().includes(q) ||
          h.sector.toLowerCase().includes(q) ||
          (h.companyName?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [holdings, active, sectorFilter, plFilter, deferredSearch]);

  const showCash =
    Math.abs(cashBal) >= 0.0001 &&
    active.has(CASH_KEY) &&
    (!sectorFilter || sectorFilter === CASH_KEY) &&
    plFilter !== "loss" &&
    (!deferredSearch.trim() ||
      cashLabel.toLowerCase().includes(deferredSearch.trim().toLowerCase()) ||
      CASH_KEY.toLowerCase().includes(deferredSearch.trim().toLowerCase()));

  const sectorChart = useMemo(() => {
    const bySector = new Map<string, number>();
    for (const h of filteredHoldings) {
      const w = navWeightByStock.get(h.stockId) ?? 0;
      const key = h.sector || "Unclassified";
      bySector.set(key, (bySector.get(key) || 0) + w);
    }
    if (showCash && cashWeight != null && cashWeight > 0) {
      bySector.set(cashLabel, (bySector.get(cashLabel) || 0) + cashWeight);
    }
    return [...bySector.entries()]
      .map(([name, weight], i) => ({
        name,
        value: Math.max(0, weight * 100),
        fill: SECTOR_TONES[i % SECTOR_TONES.length],
      }))
      .filter((r) => r.value > 0.05);
  }, [filteredHoldings, navWeightByStock, showCash, cashWeight, cashLabel]);

  const returnChart = useMemo(() => {
    const rows = filteredHoldings.map((h) => ({
      name: h.ticker,
      returnPct: h.gainLossPct,
      fill: h.gainLossPct >= 0 ? "#18a270" : "#e24b57",
    }));
    if (showCash) rows.push({ name: cashLabel, returnPct: 0, fill: "#94a3b8" });
    return rows.reverse();
  }, [filteredHoldings, showCash, cashLabel]);

  const allocationChart = useMemo(() => {
    const rows = filteredHoldings
      .map((h) => {
        const w = navWeightByStock.get(h.stockId);
        return { name: h.ticker, weightPct: w == null ? 0 : w * 100 };
      })
      .sort((a, b) => b.weightPct - a.weightPct);
    if (showCash && cashWeight != null) rows.push({ name: cashLabel, weightPct: cashWeight * 100 });
    return rows;
  }, [filteredHoldings, navWeightByStock, showCash, cashWeight, cashLabel]);

  const sectorWeightByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sectors) m.set(s.sector, s.weight);
    if (cashWeight != null) m.set(CASH_KEY, cashWeight);
    return m;
  }, [sectors, cashWeight]);

  const totals = useMemo(() => {
    const equityValue = filteredHoldings.reduce((s, h) => s + h.currentValue, 0) + (showCash ? cashBal : 0);
    const totalCost = filteredHoldings.reduce((s, h) => s + h.totalCost, 0) + (showCash ? cashBal : 0);
    const pl = filteredHoldings.reduce((s, h) => s + h.gainLossValue, 0);
    const weight =
      filteredHoldings.reduce((s, h) => s + (navWeightByStock.get(h.stockId) ?? 0), 0) +
      (showCash ? (cashWeight ?? 0) : 0);
    return { equityValue, totalCost, pl, weight };
  }, [filteredHoldings, showCash, cashBal, navWeightByStock, cashWeight]);

  return (
    <section className="space-y-4 text-start" dir={dir} aria-label={t("historicalPortfolio.ariaLabel")} aria-busy={loading}>
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]">
        <section className="cdp-sectors hp-sector-panel !m-0" aria-labelledby="hp-sector-title">
          <PanelTitle id="hp-sector-title" title={t("historicalPortfolio.sectoralBreakdown")} hint={src("sector")} />
          <div className="h-40 shrink-0 px-2">
            {loading ? (
              <ChartSkeleton />
            ) : sectorChart.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">{t("historicalPortfolio.noSectorWeights")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorChart} dataKey="value" nameKey="name" innerRadius={40} outerRadius={64} paddingAngle={2}>
                    {sectorChart.map((e) => (
                      <Cell key={e.name} fill={e.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="cdp-sectors-mix mx-3 mb-2 shrink-0" aria-hidden>
            {loading ? (
              <Skeleton className="h-2 w-full rounded-full" />
            ) : (
              sectorChart.map((s) => (
                <i key={s.name} style={{ width: `${s.value}%`, background: s.fill }} />
              ))
            )}
          </div>
          <ul className="cdp-sectors-list hp-sector-list">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="cdp-sector">
                    <div className="cdp-sector-top">
                      <Skeleton className="h-3.5 w-28 rounded-full" />
                      <Skeleton className="h-3.5 w-12 rounded-full" />
                    </div>
                  </li>
                ))
              : sectorChart.map((s) => (
              <li key={s.name} className="cdp-sector">
                <div className="cdp-sector-top">
                  <span className="cdp-sector-name">
                    <i style={{ background: s.fill }} />
                    {s.name}
                  </span>
                  <span className="cdp-sector-meta">
                    <em className="font-data">{s.value.toFixed(1)}%</em>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="hp-holdings-card min-w-0">
          <div className="hp-holdings-toolbar">
            <div className="hp-holdings-title">
              <b>{t("historicalPortfolio.holdingsAnalytics")}</b>
              <span>
                {t("customerDetail.entriesOf", {
                  filtered: filteredHoldings.length + (showCash ? 1 : 0),
                  total: holdings.length + (Math.abs(cashBal) >= 0.0001 ? 1 : 0),
                })}
              </span>
            </div>

            <div className="hp-holdings-filters">
              <label className="hp-search">
                <Search className="size-4 shrink-0" aria-hidden />
                <input
                  dir={dir}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("historicalPortfolio.searchHoldings")}
                  aria-label={t("historicalPortfolio.searchHoldings")}
                />
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="hp-filter-btn">
                    <Filter className="size-3.5 shrink-0" aria-hidden />
                    <span>
                      {allSelected
                        ? t("historicalPortfolio.tickerFilter")
                        : t("historicalPortfolio.tickersSelected", { count: selectedCount })}
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="hp-ticker-popover w-[min(18rem,calc(100vw-2rem))] p-0">
                  <div className="flex items-center justify-between gap-2 border-b border-(--shell-line) px-3 py-2">
                    <span className="text-[11px] font-bold text-(--shell-muted)">{t("historicalPortfolio.tickerFilter")}</span>
                    <div className="flex gap-2 text-[10px] font-semibold text-(--shell-blue)">
                      <button type="button" className="hover:underline" onClick={() => setSelected(new Set(tickers))}>
                        {t("common.all")}
                      </button>
                      <span className="text-muted-foreground">·</span>
                      <button type="button" className="hover:underline" onClick={() => setSelected(new Set())}>
                        {t("common.clear")}
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-64 space-y-0.5 overflow-auto px-2 py-2">
                    {tickers.map((tkr) => {
                      const on = active.has(tkr);
                      return (
                        <li key={tkr}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors",
                              on
                                ? "bg-[color-mix(in_srgb,var(--shell-blue)_10%,var(--shell-mix-base))] text-(--shell-blue)"
                                : "hover:bg-muted/50",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="size-3.5 accent-(--shell-blue)"
                              checked={on}
                              onChange={() => toggle(tkr)}
                            />
                            <span className="font-mono font-semibold">{tkr === CASH_KEY ? cashLabel : tkr}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  {!allSelected ? (
                    <p className="border-t border-(--shell-line) px-3 py-2 text-[10px] text-(--shell-muted)">
                      {t("historicalPortfolio.filterNote")}
                    </p>
                  ) : null}
                </PopoverContent>
              </Popover>

              <SelectField
                className="hp-filter-select !w-fit"
                value={sectorFilter}
                onValueChange={setSectorFilter}
                aria-label={t("common.sector")}
                options={[
                  { value: "", label: t("historicalPortfolio.allSectors") },
                  ...sectorOptions.map((s) => ({ value: s, label: s === CASH_KEY ? cashLabel : s })),
                ]}
              />

              <SelectField
                className="hp-filter-select !w-fit"
                value={plFilter}
                onValueChange={(v) => setPlFilter(v as PlFilter)}
                aria-label={t("historicalPortfolio.pl")}
                options={[
                  { value: "", label: t("historicalPortfolio.allPl") },
                  { value: "gain", label: t("historicalPortfolio.gainers") },
                  { value: "loss", label: t("historicalPortfolio.losers") },
                ]}
              />

              {hasActiveFilters ? (
                <button type="button" className="hp-clear" onClick={clearFilters}>
                  {t("common.clearFilters")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="cdp-table-wrap hp-table-wrap hp-thin-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <HintHead hint={src("ticker")}>{t("common.ticker")}</HintHead>
                  <HintHead hint={src("company")}>{t("common.companyName")}</HintHead>
                  <TableHead>{t("historicalPortfolio.buyingDate")}</TableHead>
                  <HintHead hint={src("sectorCol")}>{t("common.sector")}</HintHead>
                  <HintHead hint={src("shares")} className="text-start">{t("historicalPortfolio.shares")}</HintHead>
                  <HintHead hint={src("costPrice")} className="text-start">{t("historicalPortfolio.costPrice")}</HintHead>
                  <HintHead hint={src("price")} className="text-start">{t("common.price")}</HintHead>
                  <HintHead hint={src("equity")} className="text-start">{t("historicalPortfolio.equity")}</HintHead>
                  <HintHead hint={src("totalCost")} className="text-start">{t("historicalPortfolio.totalCost")}</HintHead>
                  <HintHead hint={src("profitLoss")} className="text-start">{t("historicalPortfolio.profitLoss")}</HintHead>
                  <HintHead hint={src("weightPct")} className="text-start">{t("historicalPortfolio.weightPct")}</HintHead>
                  <HintHead hint={src("holdingDays")} className="text-start">{t("historicalPortfolio.holdingDays")}</HintHead>
                  <HintHead hint={src("returnContribution")} className="text-start">{t("historicalPortfolio.returnContribution")}</HintHead>
                  <HintHead hint={src("annualizedReturn")} className="text-start">{t("historicalPortfolio.annualizedReturn")}</HintHead>
                  <HintHead hint={src("returnCol")} className="text-start">{t("historicalPortfolio.return")}</HintHead>
                  <HintHead hint={src("sectoralDis")} className="text-start">{t("historicalPortfolio.sectoralDis")}</HintHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeletonRows cols={TABLE_COLS} rows={8} />
                ) : filteredHoldings.length === 0 && !showCash ? (
                  <TableRow>
                    <TableCell colSpan={TABLE_COLS} className="py-10 text-center text-muted-foreground">
                      {t("historicalPortfolio.noRows")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredHoldings.map((h) => {
                      const w = navWeightByStock.get(h.stockId);
                      const sectorW = sectorWeightByName.get(h.sector);
                      return (
                        <TableRow key={h.stockId}>
                          <TableCell>
                            <Link href={`/stocks/${h.stockId}?portfolioId=${portfolioId}`}>
                              <div className="flex items-center gap-2 hover:text-primary">
                                <div className="sym-tag">{h.ticker}</div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-[12rem] truncate text-xs text-muted-foreground" title={h.companyName || undefined}>
                            {h.companyName || "—"}
                          </TableCell>
                          <TableCell className="font-data text-xs tabular-nums whitespace-nowrap">{formatBuyingDate(h.openedOn)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono bg-card text-[10px]">
                              {h.sector}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-start font-data cdp-col-qty">{h.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-start font-data cdp-col-avg">{formatCurrency(h.avgCost)}</TableCell>
                          <TableCell className="text-start font-data cdp-col-price">{formatCurrency(h.currentPrice)}</TableCell>
                          <TableCell className="text-start font-data cdp-col-mv">{formatCurrency(h.currentValue)}</TableCell>
                          <TableCell className="text-start font-data cdp-col-cost">{formatCurrency(h.totalCost)}</TableCell>
                          <TableCell className={cn("text-start font-data", h.gainLossValue >= 0 ? "text-gain" : "text-loss")}>
                            <span className="inline-flex items-center justify-start gap-1.5">
                              <PlDot value={h.gainLossValue} />
                              {formatCurrency(h.gainLossValue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-start">
                            <WeightBar weight={w} />
                          </TableCell>
                          <TableCell className="text-start font-data">{h.holdingDays ?? "—"}</TableCell>
                          <TableCell className={cn("text-start font-data rounded-md px-1", heatmapClass(h.excelContributionPct))}>
                            {formatSignedPct(h.excelContributionPct)}
                          </TableCell>
                          <TableCell className={cn("text-start font-data rounded-md px-1", heatmapClass(h.excelAnnualizedPct))}>
                            {formatSignedPct(h.excelAnnualizedPct)}
                          </TableCell>
                          <TableCell className={cn("text-start font-data rounded-md px-1", heatmapClass(h.gainLossPct))}>
                            {formatSignedPct(h.gainLossPct)}
                          </TableCell>
                          <TableCell className="text-start font-data cdp-col-wt">
                            {sectorW == null ? "—" : `${(sectorW * 100).toFixed(1)}%`}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {showCash && (
                      <TableRow>
                        <TableCell>
                          <div className="sym-tag">{cashLabel}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">—</TableCell>
                        <TableCell className="font-data text-xs tabular-nums whitespace-nowrap">{formatBuyingDate(cashOpenedOn)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono bg-card text-[10px]">
                            {cashLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-start font-data cdp-col-qty">{Math.round(cashBal).toLocaleString()}</TableCell>
                        <TableCell className="text-start font-data">—</TableCell>
                        <TableCell className="text-start font-data cdp-col-price">1.00</TableCell>
                        <TableCell className={cn("text-start font-data cdp-col-mv", cashBal >= 0 ? "text-gain" : "text-loss")}>
                          {formatCurrency(cashBal)}
                        </TableCell>
                        <TableCell className="text-start font-data cdp-col-cost">{formatCurrency(cashBal)}</TableCell>
                        <TableCell className="text-start font-data">
                          <span className="inline-flex items-center justify-start gap-1.5">
                            <PlDot value={0} />{formatCurrency(0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-start">
                          <WeightBar weight={cashWeight} />
                        </TableCell>
                        <TableCell className="text-start font-data">{cashHoldingDays ?? "—"}</TableCell>
                        <TableCell className="text-start font-data">{formatSignedPct(0)}</TableCell>
                        <TableCell className="text-start font-data">{formatSignedPct(0)}</TableCell>
                        <TableCell className="text-start font-data">{formatSignedPct(0)}</TableCell>
                        <TableCell className="text-start font-data cdp-col-wt">
                          {cashWeight == null ? "—" : `${(cashWeight * 100).toFixed(1)}%`}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="hp-total-row font-semibold">
                      <TableCell colSpan={7}>{t("historicalPortfolio.total")}</TableCell>
                      <TableCell className="text-start font-data cdp-col-mv">{formatCurrency(totals.equityValue)}</TableCell>
                      <TableCell className="text-start font-data cdp-col-cost">{formatCurrency(totals.totalCost)}</TableCell>
                      <TableCell className={cn("text-start font-data", totals.pl >= 0 ? "text-gain" : "text-loss")}>
                        {formatCurrency(totals.pl)}
                      </TableCell>
                      <TableCell className="text-start font-data cdp-col-wt">{(totals.weight * 100).toFixed(1)}%</TableCell>
                      <TableCell colSpan={5} />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <section className="cdp-sectors !m-0 flex min-h-[20rem] flex-col">
          <PanelTitle title={t("historicalPortfolio.return")} hint={src("returnChart")} />
          <div className="relative h-[18rem] w-full px-1 pb-2">
            {loading ? (
              <ChartSkeleton />
            ) : returnChart.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">{t("historicalPortfolio.noReturnSeries")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnChart} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f5" />
                  <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#50669a" }} />
                  <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10, fill: "#50669a" }} />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(2)}%`} />
                  <Bar dataKey="returnPct" radius={[0, 6, 6, 0]}>
                    {returnChart.map((e) => (
                      <Cell key={e.name} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
        <section className="cdp-sectors !m-0 flex min-h-[20rem] flex-col">
          <PanelTitle title={t("historicalPortfolio.assetAllocation")} hint={src("allocation")} />
          <div className="relative h-[18rem] w-full px-1 pb-2">
            {loading ? (
              <ChartSkeleton />
            ) : allocationChart.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">{t("historicalPortfolio.noAllocationWeights")}</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocationChart} margin={{ left: 8, right: 12, top: 12, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#50669a" }} interval={0} angle={-32} textAnchor="end" height={48} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: "#50669a" }} width={40} />
                  <Tooltip formatter={(v: number) => `${Number(v).toFixed(1)}%`} />
                  <Bar dataKey="weightPct" fill="#1f58e9" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {dailyChanges.length > 1 && (
        <section className="cdp-sectors hp-daily-card !m-0" aria-labelledby="hp-daily-title">
          <PanelTitle id="hp-daily-title" title={t("historicalPortfolio.dailyChanges")} hint={src("dailyNav")} />
          <div className="hp-daily-table hp-thin-scroll cdp-table-wrap">
            <Table wrapClassName="overflow-visible">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("historicalPortfolio.dateLabel")}</TableHead>
                  <HintHead hint={src("dailyNav")} className="text-start">{t("historicalPortfolio.portfolioValue")}</HintHead>
                  <HintHead hint={src("dailyChgQar")} className="text-start">{t("historicalPortfolio.dailyChgQar")}</HintHead>
                  <HintHead hint={src("dailyChgPct")} className="text-start">{t("historicalPortfolio.dailyChgPct")}</HintHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...dailyChanges].slice(-15).reverse().map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-data text-xs tabular-nums">{row.date}</TableCell>
                    <TableCell className="text-start font-data text-xs tabular-nums">{formatCurrency(row.nav)}</TableCell>
                    <TableCell className={cn("text-start font-data text-xs tabular-nums", row.chgQar == null ? "" : row.chgQar >= 0 ? "text-[var(--color-positive)]" : "text-loss")}>
                      {row.chgQar == null ? "—" : formatCurrency(row.chgQar)}
                    </TableCell>
                    <TableCell className={cn("text-start font-data text-xs tabular-nums", row.chgPct == null ? "" : row.chgPct >= 0 ? "text-[var(--color-positive)]" : "text-loss")}>
                      {formatSignedPct(row.chgPct)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </section>
  );
}
