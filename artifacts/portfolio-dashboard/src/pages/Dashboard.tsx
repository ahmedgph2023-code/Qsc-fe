import { Link } from "wouter";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/layout/Shell";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/phase1/PageHeader";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { QuoteBoard, quoteLogoLabel } from "@/components/phase1/QuoteBoard";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import {
  extClientDisplayName,
  getSqlFirmOverview,
  getStockMovers,
  type SqlFirmOverview,
} from "@/lib/api";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const MIX_COLORS = { equity: "var(--shell-blue)", cash: "#18a270" };
/** Single brand scale (lighter = smaller client) — follows Display settings main color. */
const TOP_BAR_BLUE = [
  "var(--shell-blue)",
  "color-mix(in srgb, var(--shell-blue) 88%, white)",
  "color-mix(in srgb, var(--shell-blue) 76%, white)",
  "color-mix(in srgb, var(--shell-blue) 64%, white)",
  "color-mix(in srgb, var(--shell-blue) 52%, white)",
  "color-mix(in srgb, var(--shell-blue) 42%, white)",
  "color-mix(in srgb, var(--shell-blue) 34%, white)",
  "color-mix(in srgb, var(--shell-blue) 28%, white)",
];

/** Soften ALL-CAPS Latin names for chart labels; leave Arabic/mixed alone. */
function displayClientName(raw: string): string {
  const name = raw.trim();
  if (!name || /[\u0600-\u06FF]/.test(name)) return name;
  if (/[a-z]/.test(name) || !/[A-Z]/.test(name)) return name;
  return name
    .toLowerCase()
    .replace(/\b([a-z])/g, (ch) => ch.toUpperCase())
    .replace(/\b([A-Z])\./g, (m) => m.toUpperCase());
}

function shortChartLabel(raw: string, max = 16): string {
  const name = displayClientName(raw);
  if (name.length <= max) return name;
  return `${name.slice(0, Math.max(1, max - 1))}…`;
}

/** Avoid flat series collapsing Y ticks to the same label (e.g. 137.3M × N). */
function paddedDomain(values: number[]): [number, number] {
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (max === min) {
    const pad = Math.max(Math.abs(max) * 0.02, 50_000);
    return [min - pad, max + pad];
  }
  const span = max - min;
  return [min - span * 0.14, max + span * 0.2];
}

function useDashboardLocale() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const numberLocale = isAr ? "ar-QA" : "en-QA";
  const dateLocale = isAr ? "ar-QA" : "en-GB";

  const formatQar = (val: number) =>
    new Intl.NumberFormat(numberLocale, { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(val);

  const formatCompact = (val: number) =>
    new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(val);

  const formatTickDate = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(dateLocale, { day: "2-digit", month: "short" });
  };

  return { t, i18n, formatQar, formatCompact, formatTickDate, numberLocale, dateLocale };
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[22px] border border-white/95 bg-[linear-gradient(160deg,#ffffff_0%,#f5f8ff_55%,#eef3fc_100%)] shadow-[0_14px_32px_rgba(57,82,143,0.10),inset_1px_1px_0_#fff]",
        "dark:border-white/10 dark:bg-[linear-gradient(160deg,#1a2438_0%,#151e32_55%,#121a2c_100%)] dark:shadow-[0_14px_32px_rgba(0,0,0,0.35),inset_1px_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4ebf8] px-5 py-4 dark:border-white/10">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold tracking-tight text-[#0e1837] dark:text-[var(--color-text-primary)]">{title}</h3>
          {subtitle ? <p className="mt-1 text-[12.5px] text-[#53678f] dark:text-[var(--color-text-secondary)]">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function MoneyTooltip({
  active,
  payload,
  label,
  formatQar,
  formatTickDate,
  emptyLabel,
  valueKey = "value",
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: Record<string, number | string> }>;
  label?: string;
  formatQar: (val: number) => string;
  formatTickDate: (value: string) => string;
  emptyLabel: string;
  valueKey?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const value = Number(row?.[valueKey] ?? payload[0]?.value ?? 0);
  return (
    <div className="rounded-xl border border-[#dce4f6] bg-white/95 px-3 py-2 shadow-[0_12px_28px_rgba(57,82,143,0.16)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1a2438]/95">
      <p className="text-[11px] font-semibold text-[#53678f] dark:text-[var(--color-text-secondary)]">{label ? formatTickDate(label) : emptyLabel}</p>
      <p className="mt-0.5 font-data text-sm font-bold text-[#0e1837] dark:text-[var(--color-text-primary)]">{formatQar(value)}</p>
    </div>
  );
}

function TrajectoryTooltip({
  active,
  payload,
  label,
  formatQar,
  formatTickDate,
  pvLabel,
  cashLabel,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; color?: string }>;
  label?: string;
  formatQar: (val: number) => string;
  formatTickDate: (value: string) => string;
  pvLabel: string;
  cashLabel: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const pv = payload.find((p) => p.dataKey === "value");
  const cash = payload.find((p) => p.dataKey === "cash");
  return (
    <div className="min-w-[168px] rounded-xl border border-[#dce4f6] bg-white/95 px-3.5 py-2.5 shadow-[0_14px_32px_rgba(57,82,143,0.18)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1a2438]/95">
      <p className="text-[11px] font-semibold tracking-wide text-[#53678f] dark:text-[var(--color-text-secondary)]">{formatTickDate(label)}</p>
      {pv ? (
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#24365c] dark:text-[var(--color-text-secondary)]">
            <i className="size-1.5 rounded-full bg-[var(--shell-blue)]" />
            {pvLabel}
          </span>
          <bdi className="font-data text-[12.5px] font-extrabold text-[#0e1837] dark:text-[var(--color-text-primary)]" dir="ltr">
            {formatQar(Number(pv.value || 0))}
          </bdi>
        </div>
      ) : null}
      {cash ? (
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#24365c] dark:text-[var(--color-text-secondary)]">
            <i className="size-1.5 rounded-full bg-[#18a270]" />
            {cashLabel}
          </span>
          <bdi className="font-data text-[12.5px] font-extrabold text-[#0e1837] dark:text-[var(--color-text-primary)]" dir="ltr">
            {formatQar(Number(cash.value || 0))}
          </bdi>
        </div>
      ) : null}
    </div>
  );
}

function TopClientBarTooltip({
  active,
  payload,
  formatQar,
  shareLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { fullName?: string; value?: number; sharePct?: number | null } }>;
  formatQar: (val: number) => string;
  shareLabel: (pct: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="max-w-[260px] rounded-xl border border-[#dce4f6] bg-white/95 px-3 py-2 shadow-[0_12px_28px_rgba(57,82,143,0.16)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1a2438]/95">
      <p className="text-[12px] font-bold leading-snug text-[#0e1837] dark:text-[var(--color-text-primary)]">{row.fullName}</p>
      <p className="mt-1 font-data text-sm font-extrabold text-[var(--shell-blue)]">{formatQar(Number(row.value || 0))}</p>
      {row.sharePct != null ? (
        <p className="mt-0.5 text-[11px] font-semibold text-[#53678f]">{shareLabel(row.sharePct.toFixed(1))}</p>
      ) : null}
    </div>
  );
}

function TopClientYTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const label = String(payload?.value ?? "");
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#53678f"
      fontSize={11}
      fontWeight={600}
    >
      <title>{label}</title>
      {label}
    </text>
  );
}

const ghostLink =
  "inline-flex h-9 items-center justify-center rounded-[12px] border border-[#dfe6f6] bg-[linear-gradient(145deg,#fff,#eef3fd)] px-3.5 text-[12.5px] font-bold text-[#203c72] no-underline shadow-[0_6px_14px_rgba(57,82,143,0.08)] transition hover:-translate-y-px hover:text-[var(--shell-blue)] dark:border-white/10 dark:bg-[linear-gradient(145deg,#1a2438,#151e32)] dark:text-[var(--color-text-primary)]";

function emptyOverview(): SqlFirmOverview {
  return {
    source: "sql",
    configured: true,
    asOf: null,
    qscDates: [],
    metrics: {
      totalPortfolioValue: 0,
      totalSystemCash: 0,
      totalNavDisplay: 0,
      activeClients: 0,
      avgPortfolioSize: 0,
      clientsWithShares: 0,
      clientsCashOnly: 0,
      ledgerClients: 0,
      shareTxRows: 0,
      cashTxRows: 0,
      pvDelta: null,
      pvDeltaPct: null,
      cashDelta: null,
    },
    trajectory: [],
    topClients: [],
    mix: { equity: 0, cash: 0 },
    indices: { dsm: null, qeri: null },
  };
}

export default function Dashboard() {
  const { t, i18n, formatQar, formatCompact, formatTickDate } = useDashboardLocale();
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErr,
  } = useQuery({
    queryKey: ["dashboard-sql"],
    queryFn: () => getSqlFirmOverview(),
    staleTime: 60_000,
    retry: 1,
  });
  const {
    data: movers,
    isLoading: stocksLoading,
    isError: stocksError,
  } = useQuery({
    queryKey: ["stock-movers", 5],
    queryFn: () => getStockMovers(5),
    staleTime: 60_000,
    retry: 1,
  });

  const o = overview || emptyOverview();
  const m = o.metrics;
  const firmTrend = o.trajectory.map((d) => ({
    date: d.date,
    value: d.portfolioValue,
    cash: d.systemCash,
    nav: d.navDisplay,
  }));
  const trendYDomain = paddedDomain(firmTrend.flatMap((d) => [d.value, d.cash]));
  const trendStart = firmTrend[0];
  const trendEnd = firmTrend[firmTrend.length - 1];
  const mixRows = [
    { name: t("dashboard.mixEquity"), value: Math.max(0, m.totalPortfolioValue), fill: MIX_COLORS.equity },
    { name: t("dashboard.mixCash"), value: Math.max(0, m.totalSystemCash), fill: MIX_COLORS.cash },
  ].filter((r) => r.value > 0);
  const topBars = o.topClients.map((c, i) => {
    const fullName = displayClientName(
      extClientDisplayName(c, i18n.language) || String(c.clientId),
    );
    return {
      id: String(c.clientId),
      name: shortChartLabel(fullName, 16),
      fullName,
      value: c.portfolioValue,
      sharePct: m.totalPortfolioValue > 0 ? (c.portfolioValue / m.totalPortfolioValue) * 100 : null,
      fill: TOP_BAR_BLUE[i % TOP_BAR_BLUE.length],
    };
  });
  const topBarsHeight = Math.max(260, topBars.length * 36 + 28);
  const moversFallback = movers || [];
  const dsm = o.indices.dsm;
  const sqlError =
    overviewError
      ? ((overviewErr as Error)?.message || t("dashboard.sqlUnavailableDesc"))
      : null;
  const pvDeltaLabel =
    m.pvDeltaPct == null
      ? null
      : `${m.pvDeltaPct >= 0 ? "+" : ""}${m.pvDeltaPct.toFixed(2)}`;

  return (
    <Shell>
      <div className="space-y-6 p-4 pt-8">
        <PageHeader
          className="mb-0 border-b-0 pb-0"
          title={t("dashboard.title")}
          description={t("dashboard.descriptionSql")}
          titleClassName="text-[clamp(1.75rem,3vw,2.4rem)] font-extrabold leading-none tracking-[-0.035em] text-[#0e1837] dark:text-[var(--color-text-primary)]"
          descriptionClassName="mt-3 max-w-2xl text-[15px] text-[#53678f] dark:text-[var(--color-text-secondary)]"
          actions={
            o.asOf ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe6f6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#203c72] shadow-[0_6px_14px_rgba(57,82,143,0.08)] dark:border-white/10 dark:bg-[#1a2438] dark:text-[var(--color-text-primary)]">
                <Database className="size-3.5 text-[var(--shell-blue)]" />
                {t("dashboard.sqlAsOf", { asOf: o.asOf })}
              </span>
            ) : null
          }
        />

        {sqlError ? (
          <EmptyState
            icon={<Database className="h-10 w-10" />}
            title={t("dashboard.sqlUnavailableTitle")}
            description={sqlError}
            action={
              <Link href="/balances" className={ghostLink}>
                {t("dashboard.openBalances")}
              </Link>
            }
          />
        ) : null}

        <StatsSummaryBar
          ariaLabel={t("dashboard.firmOverview")}
          loading={overviewLoading}
          className="mt-2"
          iconSize={72}
          items={[
            {
              id: "pv",
              icon: "/Total AUM.png",
              label: t("dashboard.qscPortfolioValue"),
              value: <AnimatedNumber value={m.totalPortfolioValue} format="compactCurrency" />,
              hint: t("dashboard.qscPortfolioValueNote"),
            },
            {
              id: "delta",
              icon: "/Daily P&L.png",
              label: t("dashboard.pvChange"),
              value: (
                <AnimatedNumber
                  value={m.pvDelta == null ? null : Math.abs(m.pvDelta)}
                  format="compactCurrency"
                  signed={false}
                  prefix={m.pvDelta != null && m.pvDelta >= 0 ? "↗ " : m.pvDelta != null ? "↘ " : ""}
                />
              ),
              hint:
                overviewLoading || pvDeltaLabel == null
                  ? t("dashboard.vsPriorSnapshot")
                  : t("dashboard.vsPriorSnapshotPct", { pct: pvDeltaLabel }),
              valueClassName:
                m.pvDelta == null ? undefined : m.pvDelta >= 0 ? "text-[var(--color-positive)]" : "text-loss",
            },
            {
              id: "clients",
              icon: "/Active portfolios.png",
              label: t("dashboard.activePortfolios"),
              value: <AnimatedNumber value={m.activeClients} format="integer" />,
              hint: t("dashboard.clientsLedgerHint", {
                ledger: m.ledgerClients,
                shares: m.clientsWithShares,
              }),
            },
            {
              id: "cash",
              icon: "/Cash-2.png",
              label: t("dashboard.systemCash"),
              value: <AnimatedNumber value={m.totalSystemCash} format="compactCurrency" />,
              hint: t("dashboard.systemCashNote"),
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
          <ChartCard
            title={t("dashboard.aumTrajectory")}
            subtitle={t("dashboard.aumTrajectorySqlSub")}
            action={
              m.pvDeltaPct == null ? null : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                    m.pvDeltaPct >= 0
                      ? "bg-[#edfff8] text-[#139366] dark:bg-[rgba(61,207,142,0.16)] dark:text-[var(--color-positive)]"
                      : "bg-[#fff0f1] text-[#e24b57] dark:bg-[rgba(240,113,88,0.16)] dark:text-[var(--color-negative)]",
                  )}
                >
                  <ArrowUpRight className={cn("size-3.5", (m.pvDeltaPct ?? 0) < 0 && "rotate-90")} />
                  {t("dashboard.seriesPct", {
                    pct: `${m.pvDeltaPct >= 0 ? "+" : ""}${m.pvDeltaPct.toFixed(1)}`,
                  })}
                </span>
              )
            }
            bodyClassName="pt-3"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#e4ebf8] bg-[radial-gradient(120%_80%_at_10%_0%,#eef4ff_0%,#f8faff_42%,#ffffff_100%)] p-3 sm:p-4 dark:border-white/10 dark:bg-[radial-gradient(120%_80%_at_10%_0%,rgba(44,98,232,0.16)_0%,#151e32_42%,#121a2c_100%)]">
              <div
                className="pointer-events-none absolute inset-x-8 top-6 h-24 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(23,96,243,0.12),transparent_70%)] blur-2xl"
                aria-hidden
              />
              <div className="relative h-[320px]">
                {overviewLoading ? (
                  <div className="flex h-full items-end gap-2 px-1">
                    {[40, 65, 50, 80, 60, 90, 70, 100, 85, 95].map((h, i) => (
                      <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }} />
                    ))}
                  </div>
                ) : firmTrend.length === 0 ? (
                  <EmptyState title={t("dashboard.emptyAumTitle")} description={t("dashboard.emptyAumSqlDesc")} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={firmTrend} margin={{ top: 16, right: 12, left: 4, bottom: 4 }}>
                      <defs>
                        <linearGradient id="dash-sql-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--shell-blue)" stopOpacity={0.38} />
                          <stop offset="45%" stopColor="var(--shell-blue)" stopOpacity={0.16} />
                          <stop offset="100%" stopColor="var(--shell-accent)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dash-sql-stroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="var(--shell-accent)" />
                          <stop offset="55%" stopColor="var(--shell-blue)" />
                          <stop offset="100%" stopColor="var(--shell-blue)" />
                        </linearGradient>
                        <filter id="dash-sql-glow" x="-20%" y="-40%" width="140%" height="180%">
                          <feGaussianBlur stdDeviation="2.2" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="2 8" stroke="rgba(119,141,198,0.2)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatTickDate}
                        minTickGap={36}
                        tick={{ fill: "#7a879c", fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCompact(Number(v))}
                        width={52}
                        tickCount={5}
                        tick={{ fill: "#8a97ad", fontSize: 10.5 }}
                        axisLine={false}
                        tickLine={false}
                        domain={trendYDomain}
                        allowDataOverflow
                      />
                      <Tooltip
                        content={
                          <TrajectoryTooltip
                            formatQar={formatQar}
                            formatTickDate={formatTickDate}
                            pvLabel={t("dashboard.mixEquity")}
                            cashLabel={t("dashboard.mixCash")}
                          />
                        }
                        cursor={{ stroke: "var(--shell-blue)", strokeDasharray: "4 4", strokeOpacity: 0.4 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={t("dashboard.mixEquity")}
                        stroke="url(#dash-sql-stroke)"
                        strokeWidth={3}
                        fill="url(#dash-sql-fill)"
                        filter="url(#dash-sql-glow)"
                        dot={
                          firmTrend.length <= 6
                            ? { r: 4.5, fill: "#fff", stroke: "var(--shell-blue)", strokeWidth: 2.5 }
                            : false
                        }
                        activeDot={{ r: 6, strokeWidth: 2.5, fill: "#fff", stroke: "var(--shell-blue)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cash"
                        name={t("dashboard.mixCash")}
                        stroke="#18a270"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#18a270" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            {!overviewLoading && trendStart && trendEnd ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: t("dashboard.trajStart"), value: formatCompact(trendStart.value) },
                  { label: t("dashboard.trajEnd"), value: formatCompact(trendEnd.value) },
                  { label: t("dashboard.mixCash"), value: formatCompact(trendEnd.cash) },
                  {
                    label: t("dashboard.trajPoints"),
                    value: String(firmTrend.length),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-[#e6ecf7] bg-white/80 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#7a879c] dark:text-[var(--color-text-muted)]">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 font-data text-[13.5px] font-extrabold text-[#0e1837] dark:text-[var(--color-text-primary)]">{stat.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </ChartCard>

          <ChartCard
            title={t("dashboard.bookMix")}
            subtitle={t("dashboard.bookMixSub")}
            action={<Link href="/balances" className={ghostLink}>{t("dashboard.openBalances")}</Link>}
          >
            {overviewLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="mx-auto size-28 rounded-full" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ) : mixRows.length === 0 ? (
              <EmptyState title={t("dashboard.emptyMixTitle")} description={t("dashboard.emptyMixDesc")} />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <div className="relative mx-auto h-[140px] w-full max-w-[168px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mixRows}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        {mixRows.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [formatQar(Number(value)), name]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #dce4f6",
                          boxShadow: "0 12px 28px rgba(57,82,143,0.14)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-data text-base font-extrabold text-[#0e1837]">
                      {formatCompact(m.totalNavDisplay)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7a879c]">
                      {t("dashboard.navDisplay")}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {mixRows.map((row) => (
                    <li
                      key={row.name}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#e6ecf7] bg-white/80 px-2.5 py-2 dark:border-white/10 dark:bg-white/5"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[#24365c]">
                        <i className="inline-block size-2 shrink-0 rounded-full" style={{ background: row.fill }} />
                        <span className="truncate">{row.name}</span>
                      </span>
                      <bdi className="shrink-0 font-data text-[11.5px] font-extrabold text-[#0e1837]" dir="ltr">
                        {formatCompact(row.value)}
                      </bdi>
                    </li>
                  ))}
                  <li className="flex items-center justify-between px-1 pt-1 text-[11.5px] text-[#53678f]">
                    <span className="truncate">{t("dashboard.cashOnlyClients")}</span>
                    <span className="font-data font-bold text-[#0e1837]">{m.clientsCashOnly}</span>
                  </li>
                </ul>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard
            title={t("dashboard.topSqlClients")}
            subtitle={t("dashboard.topSqlClientsSub")}
            action={<Link href="/customers" className={ghostLink}>{t("dashboard.allClients")}</Link>}
          >
            <div style={{ height: topBarsHeight }}>
              {overviewLoading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full rounded-xl" />
                  ))}
                </div>
              ) : topBars.length === 0 ? (
                <EmptyState title={t("dashboard.emptyClientsTitle")} description={t("dashboard.emptyClientsSqlDesc")} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topBars}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(119,141,198,0.18)" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCompact(Number(v))}
                      tick={{ fill: "#7a879c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={118}
                      interval={0}
                      tick={<TopClientYTick />}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <TopClientBarTooltip
                          formatQar={formatQar}
                          shareLabel={(pct) => t("dashboard.firmShare", { pct })}
                        />
                      }
                      cursor={{ fill: "rgba(23,96,243,0.06)" }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={16} isAnimationActive>
                      {topBars.map((row) => (
                        <Cell key={row.id} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title={t("dashboard.indexPulse")}
            subtitle={t("dashboard.indexPulseSub")}
            action={<Link href="/indices" className={ghostLink}>{t("dashboard.openIndices")}</Link>}
          >
            <div className="h-[260px]">
              {overviewLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : !dsm?.series?.length ? (
                <EmptyState title={t("dashboard.emptyIndexTitle")} description={t("dashboard.emptyIndexDesc")} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dsm.series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dash-dsm-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#18a270" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#18a270" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(119,141,198,0.22)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTickDate}
                      minTickGap={40}
                      tick={{ fill: "#7a879c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tickFormatter={(v) => formatCompact(Number(v))}
                      width={44}
                      tick={{ fill: "#7a879c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={
                        <MoneyTooltip
                          formatQar={(v) =>
                            new Intl.NumberFormat(i18n.language?.startsWith("ar") ? "ar-QA" : "en-QA", {
                              maximumFractionDigits: 2,
                            }).format(v)
                          }
                          formatTickDate={formatTickDate}
                          emptyLabel={t("common.na")}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#18a270"
                      strokeWidth={2.5}
                      fill="url(#dash-dsm-fill)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#18a270" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            {dsm ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#e6ecf7] pt-3 text-[12.5px]">
                <span className="font-bold text-[#24365c]">{dsm.name}</span>
                <bdi className="font-data font-extrabold text-[#0e1837]" dir="ltr">
                  {dsm.last.toLocaleString(i18n.language?.startsWith("ar") ? "ar-QA" : "en-QA", {
                    maximumFractionDigits: 2,
                  })}
                </bdi>
                {dsm.changePct != null ? (
                  <span className={cn("font-extrabold", dsm.changePct >= 0 ? "text-[#139366]" : "text-[#e24b57]")}>
                    {dsm.changePct >= 0 ? "+" : ""}
                    {dsm.changePct.toFixed(2)}%
                  </span>
                ) : null}
                {o.indices.qeri ? (
                  <span className="ms-auto text-[#53678f]">
                    {o.indices.qeri.name}:{" "}
                    <bdi className="font-data font-bold text-[#0e1837]" dir="ltr">
                      {o.indices.qeri.last.toLocaleString(i18n.language?.startsWith("ar") ? "ar-QA" : "en-QA", {
                        maximumFractionDigits: 2,
                      })}
                    </bdi>
                  </span>
                ) : null}
              </div>
            ) : null}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <QuoteBoard
            title={t("dashboard.keyPortfolios")}
            subtitle={t("dashboard.topClientsSql")}
            icon="/Active portfolios.png"
            actionHref="/customers"
            actionLabel={t("dashboard.allClients")}
            columns={{
              asset: t("dashboard.colClient"),
              trend: t("dashboard.colTrend"),
              price: t("dashboard.colValue"),
              day: t("dashboard.colCash"),
            }}
            loading={overviewLoading}
            emptyTitle={t("dashboard.emptyClientsTitle")}
            emptyDescription={t("dashboard.emptyClientsSqlDesc")}
            paginate={false}
            rows={o.topClients.slice(0, 5).map((c) => ({
              id: String(c.clientId),
              href: `/customers/${c.clientId}`,
              logo: quoteLogoLabel(extClientDisplayName(c, i18n.language) || String(c.clientId), 2),
              title: extClientDisplayName(c, i18n.language) || String(c.clientId),
              // subtitle: t("dashboard.accountId", { id: c.clientId }),
              meta: (
                <span className="font-data text-[11px] text-[#53678f]">
                  {t("dashboard.cashMeta", {
                    cash: formatCompact(c.systemCash),
                  })}
                </span>
              ),
              sparkline: [],
              price: <AnimatedNumber value={c.portfolioValue} format="compactCurrency" />,
              priceCaption: t("common.currencyValue"),
              dayPct: null,
            }))}
          />

          <QuoteBoard
            title={t("dashboard.marketNames")}
            subtitle={t("dashboard.latestSecurities")}
            icon="/analytics.png"
            actionHref="/stocks"
            actionLabel={t("dashboard.allStocks")}
            loading={stocksLoading && !stocksError}
            emptyTitle={stocksError ? t("dashboard.moversUnavailableTitle") : t("dashboard.emptyStocksTitle")}
            emptyDescription={stocksError ? t("dashboard.moversUnavailableDesc") : t("dashboard.emptyStocksDesc")}
            paginate={false}
            rows={moversFallback.map((s) => ({
              id: s.id,
              href: `/stocks/${s.id}`,
              logo: quoteLogoLabel(s.ticker),
              title: s.ticker,
              subtitle: s.companyName,
              sparkline: s.sparkline || [],
              price: Number(s.currentPrice || 0).toFixed(2),
              priceCaption: t("common.currencyValue"),
              dayPct: s.dayChangePct,
            }))}
          />
        </div>
      </div>
    </Shell>
  );
}
