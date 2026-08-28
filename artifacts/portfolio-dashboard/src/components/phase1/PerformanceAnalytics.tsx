import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Layers, Clock, Info, Banknote, TrendingUp } from "lucide-react";
import { TimeRangeToggle } from "@/components/phase1/TimeRangeToggle";
import { EmptyState } from "@/components/phase1/PageHeader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";

type NormPoint = {
  date: string;
  portfolioNormalized: number | null;
  benchmarkNormalized: number | null;
};

function formatPerfDate(value: string, withYear = true) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" as const } : {}),
    timeZone: "Asia/Qatar",
  });
}

function periodChange(values: Array<number | null | undefined>) {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(Number(v))).map(Number);
  if (nums.length === 0) return { last: null as number | null, pct: null as number | null };
  const last = nums[nums.length - 1];
  if (nums.length < 2 || nums[0] === 0) return { last, pct: null };
  return { last, pct: ((last / nums[0]) - 1) * 100 };
}

function formatLevel(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(2);
}

function ChartTip({
  active,
  payload,
  label,
  kind,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string | number; value?: unknown; color?: string; dataKey?: string | number }>;
  label?: string | number;
  kind: "norm" | "pct";
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="perf-tooltip">
      <p className="perf-tooltip-date">{kind === "norm" ? formatPerfDate(String(label ?? "")) : label}</p>
      {payload.map((row) => (
        <div key={String(row.dataKey ?? row.name)} className="perf-tooltip-row">
          <span className="perf-tooltip-name">
            <i style={{ background: row.color || "var(--color-accent-ink)" }} />
            {String(row.name ?? "")}
          </span>
          <b className="font-data">
            {row.value == null || Number.isNaN(Number(row.value))
              ? "—"
              : kind === "pct"
                ? `${Number(row.value) >= 0 ? "+" : ""}${Number(row.value).toFixed(2)}%`
                : Number(row.value).toFixed(2)}
          </b>
        </div>
      ))}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
  tone = "accent",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "accent" | "gain";
}) {
  return (
    <div className="perf-meta-item">
      <div className={cn("perf-meta-icon", tone === "gain" && "is-gain")}>{icon}</div>
      <div className="min-w-0">
        <p className="perf-meta-label">{label}</p>
        <p className="perf-meta-value font-data">{value}</p>
      </div>
    </div>
  );
}

export function PerformanceAnalytics({
  timeRange,
  onTimeRangeChange,
  qeriRange,
  onQeriRangeChange,
  chartData,
  simpleMonthlyReturns,
  indexMonthlyReturns,
  twar,
  unrealizedPnL,
  realizedPnL,
  asOf,
  loading = false,
}: {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  qeriRange: string;
  onQeriRangeChange: (value: string) => void;
  chartData: NormPoint[];
  simpleMonthlyReturns: Array<{ year: number; month: number; simpleReturnPct: number }>;
  indexMonthlyReturns: Array<{ year: number; month: number; returnPct: number }> | null;
  twar: number;
  unrealizedPnL: number;
  realizedPnL: number;
  asOf: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const port = periodChange(chartData.map((d) => d.portfolioNormalized));
  const bench = periodChange(chartData.map((d) => d.benchmarkNormalized));
  const outPct = port.pct != null && bench.pct != null ? port.pct - bench.pct : null;
  const startDate = chartData[0]?.date;
  const endDate = chartData[chartData.length - 1]?.date ?? asOf;
  const totalPnl = unrealizedPnL + realizedPnL;

  const monthlyChart = useMemo(() => {
    const indexMap = new Map<string, number>();
    if (indexMonthlyReturns) {
      for (const i of indexMonthlyReturns) {
        indexMap.set(`${i.year}-${String(i.month).padStart(2, "0")}`, i.returnPct);
      }
    }
    const allData = simpleMonthlyReturns.map((m) => {
      const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
      return {
        label: `${String(m.month).padStart(2, "0")}/${String(m.year).slice(-2)}`,
        portfolio: m.simpleReturnPct,
        index: indexMap.get(key) ?? null,
      };
    });
    const monthsToShow = qeriRange === "6M" ? 6 : qeriRange === "1Y" ? 12 : qeriRange === "2Y" ? 24 : allData.length;
    return allData.slice(-monthsToShow);
  }, [simpleMonthlyReturns, indexMonthlyReturns, qeriRange]);

  const hasNorm = chartData.length > 0;
  const hasMonthly = monthlyChart.length > 0;

  if (!loading && !hasNorm && !hasMonthly) {
    return (
      <EmptyState
        title={t("performanceAnalytics.emptyTitle")}
        description={t("performanceAnalytics.emptyDesc")}
      />
    );
  }

  return (
    <section className="perf-analytics space-y-4" aria-label={t("performanceAnalytics.title")}>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <TimeRangeToggle value={timeRange} onChange={onTimeRangeChange} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="perf-cal" tabIndex={0} aria-label={t("performanceAnalytics.asOfAria", { asOf })}>
              <img src="/calendar-blue.png" alt="" className="h-5 w-5 object-contain" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("performanceAnalytics.asOfTooltip", { asOf })}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="perf-info" aria-label={t("performanceAnalytics.aboutCharts")}>
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">
            {t("performanceAnalytics.tooltipInfo")}
          </TooltipContent>
        </Tooltip>
      </div>

      <StatsSummaryBar
        ariaLabel={t("performanceAnalytics.title")}
        loading={loading}
        compact
        iconSize={48}
        columns={4}
        items={[
          {
            id: "port",
            icon: "/analytics.png",
            label: t("performanceAnalytics.portfolioNormalized"),
            value: loading ? <Skeleton className="h-6 w-20 rounded-full" /> : formatLevel(port.last),
            hint:
              port.pct == null
                ? t("performanceAnalytics.portfolioNormNote")
                : `${port.pct >= 0 ? "+" : ""}${port.pct.toFixed(2)}%`,
            valueClassName: port.pct != null && port.pct < 0 ? "text-loss" : undefined,
          },
          {
            id: "bench",
            icon: "/growth.png",
            label: t("performanceAnalytics.benchmarkNormalized"),
            value: loading ? <Skeleton className="h-6 w-20 rounded-full" /> : formatLevel(bench.last),
            hint:
              bench.pct == null
                ? t("performanceAnalytics.benchmarkNormNote")
                : `${bench.pct >= 0 ? "+" : ""}${bench.pct.toFixed(2)}%`,
          },
          {
            id: "out",
            icon: "/layers.png",
            label: t("performanceAnalytics.outperformance"),
            value:
              loading ? (
                <Skeleton className="h-6 w-20 rounded-full" />
              ) : outPct == null ? (
                "—"
              ) : (
                `${outPct >= 0 ? "+" : ""}${outPct.toFixed(2)}%`
              ),
            hint: t("performanceAnalytics.outperformanceNote"),
            valueClassName: outPct == null ? undefined : outPct >= 0 ? "text-[var(--color-positive)]" : "text-loss",
          },
          {
            id: "twar",
            icon: "/liquid.png",
            label: t("performanceAnalytics.twar"),
            value: loading ? (
              <Skeleton className="h-6 w-16 rounded-full" />
            ) : (
              <AnimatedNumber value={twar} format="percent" signed />
            ),
            hint: t("holdingsOverview.twarNote"),
            valueClassName: twar >= 0 ? "text-[var(--color-positive)]" : "text-loss",
          },
        ]}
      />

      <div className="perf-charts">
        {hasNorm && (
          <article className="perf-chart-card">
            <div className="perf-chart-head">
              <div>
                <h3 className="perf-chart-title">{t("performanceAnalytics.chartNormTitle")}</h3>
              </div>
            </div>
            <div className="perf-chart-plot">
              {loading ? (
                <Skeleton className="h-full min-h-[220px] w-full rounded-xl" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="perf-norm-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent-ink)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-accent-ink)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 4" stroke="var(--color-border-hairline)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-muted)"
                    fontSize={11}
                    tickFormatter={(val) => formatPerfDate(val, false)}
                    minTickGap={28}
                  />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} domain={["auto", "auto"]} tickFormatter={(val) => (val ?? 0).toFixed(0)} width={36} />
                  <ChartTooltip
                    content={({ active, payload, label }) => (
                      <ChartTip kind="norm" active={active} payload={payload} label={label} />
                    )}
                    cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "4 4" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)", paddingTop: 8 }}
                  />
                  <Area
                    name={t("performanceAnalytics.legendPortfolio")}
                    type="monotone"
                    dataKey="portfolioNormalized"
                    stroke="var(--color-accent-ink)"
                    strokeWidth={2.5}
                    fill="url(#perf-norm-fill)"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, fill: "var(--color-surface-elevated)", stroke: "var(--color-accent-ink)" }}
                    connectNulls
                  />
                  <Line
                    name={t("performanceAnalytics.legendBenchmark")}
                    type="monotone"
                    dataKey="benchmarkNormalized"
                    stroke="var(--color-neutral)"
                    strokeWidth={2}
                    strokeDasharray="6 5"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: "var(--color-surface-elevated)", stroke: "var(--color-neutral)" }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
              )}
            </div>
          </article>
        )}

        {hasMonthly && (
          <article className="perf-chart-card">
            <div className="perf-chart-head">
              <div>
                <h3 className="perf-chart-title">{t("performanceAnalytics.chartQeriTitle")}</h3>
                <p className="perf-chart-sub">{t("performanceAnalytics.chartQeriSub")}</p>
              </div>
              <TimeRangeToggle value={qeriRange} onChange={onQeriRangeChange} ranges={["6M", "1Y", "2Y", "ALL"]} />
            </div>
            <div className="perf-chart-plot">
              {loading ? (
                <Skeleton className="h-full min-h-[220px] w-full rounded-xl" />
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChart} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="var(--color-border-hairline)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={11} fontFamily="var(--font-mono)" />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} width={48} tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}%`} />
                  <ChartTooltip
                    content={({ active, payload, label }) => (
                      <ChartTip kind="pct" active={active} payload={payload} label={label} />
                    )}
                    cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "4 4" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, color: "var(--color-text-secondary)", paddingTop: 8 }}
                  />
                  <ReferenceLine y={0} stroke="var(--color-border-strong)" strokeDasharray="4 5" />
                  <Line
                    name={t("performanceAnalytics.legendSimpleReturn")}
                    type="monotone"
                    dataKey="portfolio"
                    stroke="var(--color-primary-ink)"
                    strokeWidth={2.4}
                    dot={{ r: 3.5, strokeWidth: 2, fill: "var(--color-surface-elevated)" }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    name={t("performanceAnalytics.legendQeriReturn")}
                    type="monotone"
                    dataKey="index"
                    stroke="var(--color-info)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, strokeWidth: 2, fill: "var(--color-surface-elevated)" }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
              )}
            </div>
          </article>
        )}
      </div>

      <div className="perf-meta">
        <MetaItem icon={<TrendingUp className="h-4 w-4" />} label={t("performanceAnalytics.startDate")} value={startDate ? formatPerfDate(startDate) : "—"} />
        <MetaItem icon={<CalendarDays className="h-4 w-4" />} label={t("performanceAnalytics.endDate")} value={formatPerfDate(endDate)} />
        <MetaItem icon={<Layers className="h-4 w-4" />} label={t("performanceAnalytics.baseValue")} value="100" />
        <MetaItem icon={<Clock className="h-4 w-4" />} label={t("performanceAnalytics.frequency")} value={t("performanceAnalytics.frequencyValue")} />
        <MetaItem icon={<Banknote className="h-4 w-4" />} label={t("performanceAnalytics.currency")} value={t("performanceAnalytics.currencyValue")} tone="gain" />
        <MetaItem
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("performanceAnalytics.totalPnl")}
          value={loading ? <Skeleton className="h-4 w-24 rounded-full" /> : `${totalPnl >= 0 ? "+" : "−"}${new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(Math.abs(totalPnl))}`}
          tone={totalPnl >= 0 ? "gain" : "accent"}
        />
      </div>
    </section>
  );
}
