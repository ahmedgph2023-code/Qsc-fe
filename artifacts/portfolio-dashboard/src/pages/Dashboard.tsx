import { Link } from "wouter";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/layout/Shell";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader } from "@/components/phase1/PageHeader";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { QuoteBoard, quoteLogoLabel, sparkFromRange } from "@/components/phase1/QuoteBoard";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import {
  getDashboardMetrics, getAumTrajectory, getSectors, getStocks, getCustomers, getPortfolioManager,
} from "@/lib/api";
import {
  Area,
  AreaChart,
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
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTOR_ENTER = ["#18a270", "#11a3b0", "#1f58e9"];
const SECTOR_AVOID = ["#e24b57", "#e98921"];

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

  return { t, formatQar, formatCompact, formatTickDate, numberLocale, dateLocale };
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
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4ebf8] px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold tracking-tight text-[#0e1837]">{title}</h3>
          {subtitle ? <p className="mt-1 text-[12.5px] text-[#53678f]">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function AumTooltip({
  active,
  payload,
  label,
  formatQar,
  formatTickDate,
  emptyLabel,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  formatQar: (val: number) => string;
  formatTickDate: (value: string) => string;
  emptyLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#dce4f6] bg-white/95 px-3 py-2 shadow-[0_12px_28px_rgba(57,82,143,0.16)] backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-[#53678f]">{label ? formatTickDate(label) : emptyLabel}</p>
      <p className="mt-0.5 font-data text-sm font-bold text-[#0e1837]">{formatQar(Number(payload[0]?.value || 0))}</p>
    </div>
  );
}

function SectorTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: { name: string; score: number; kind: string; fill: string } }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#dce4f6] bg-white/95 px-3 py-2 shadow-[0_12px_28px_rgba(57,82,143,0.16)] backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-[#53678f]">{row.name}</p>
      <p className="mt-0.5 text-sm font-bold text-[#0e1837]">
        {row.kind} · <span className="font-data">{row.score.toFixed(0)}</span>
      </p>
    </div>
  );
}

const ghostLink =
  "inline-flex h-9 items-center justify-center rounded-[12px] border border-[#dfe6f6] bg-[linear-gradient(145deg,#fff,#eef3fd)] px-3.5 text-[12.5px] font-bold text-[#203c72] no-underline shadow-[0_6px_14px_rgba(57,82,143,0.08)] transition hover:-translate-y-px hover:text-[#1760f3]";

export default function Dashboard() {
  const { t, formatQar, formatCompact, formatTickDate } = useDashboardLocale();
  const { data: metrics, isLoading: metricsLoading } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboardMetrics });
  const { data: trajectory, isLoading: trajectoryLoading } = useQuery({ queryKey: ["aumTrajectory"], queryFn: getAumTrajectory });
  const { data: sectors, isLoading: sectorsLoading } = useQuery({ queryKey: ["sectors"], queryFn: getSectors });
  const { data: stocks, isLoading: stocksLoading } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const { data: customers, isLoading: customersLoading } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: manager = [] } = useQuery({ queryKey: ["portfolio-manager"], queryFn: () => getPortfolioManager() });

  const topSectors = (sectors || []).filter((s) => s.signal === "enter").slice(0, 3);
  const bottomSectors = (sectors || []).filter((s) => s.signal === "avoid").slice(0, 2);
  const sectorRows = [
    ...topSectors.map((s, i) => ({
      id: s.id,
      name: s.sector || s.name,
      score: Math.max(0, Number(s.score || 0)),
      fill: SECTOR_ENTER[i % SECTOR_ENTER.length],
      kind: "Enter" as const,
    })),
    ...bottomSectors.map((s, i) => ({
      id: s.id,
      name: s.sector || s.name,
      score: Math.max(0, Number(s.score || 0)),
      fill: SECTOR_AVOID[i % SECTOR_AVOID.length],
      kind: "Avoid" as const,
    })),
  ];
  const sectorMix = [
    { name: "Enter", value: topSectors.length, fill: "#18a270" },
    { name: "Avoid", value: bottomSectors.length, fill: "#e24b57" },
  ].filter((d) => d.value > 0);
  const firmTrend = (trajectory || []).map((d) => ({ date: d.date, value: d.value }));
  const m = metrics || { totalAum: 0, activeClients: 0, avgPortfolioSize: 0, dailyPnL: 0, dailyPnLPct: 0 };
  const openRisk = manager.reduce((sum, row) => sum + row.openRiskAlerts, 0);
  const pendingRb = manager.filter((row) => row.pendingRebalance).length;
  const topClients = [...(customers || [])].sort((a, b) => b.currentValue - a.currentValue).slice(0, 5);
  const marketNames = (stocks || []).slice(0, 5);
  const aumDelta =
    firmTrend.length >= 2
      ? ((firmTrend[firmTrend.length - 1].value - firmTrend[0].value) / Math.max(1, firmTrend[0].value)) * 100
      : null;

  const pnlPctLabel = `${m.dailyPnLPct >= 0 ? "+" : ""}${m.dailyPnLPct.toFixed(2)}`;

  return (
    <Shell>
      <div className=" p-4 pt-8 space-y-6">
        <PageHeader
          className="mb-0 border-b-0 pb-0"
          title={t("dashboard.title")}
          description={t("dashboard.description")}
          titleClassName="text-[clamp(1.75rem,3vw,2.4rem)] font-extrabold leading-none tracking-[-0.035em] text-[#0e1837]"
          descriptionClassName="mt-3 max-w-2xl text-[15px] text-[#53678f]"
        />

        <StatsSummaryBar
          ariaLabel={t("dashboard.firmOverview")}
          loading={metricsLoading}
          className="mt-6"
          iconSize={72}
          items={[
            {
              id: "aum",
              icon: "/Total AUM.png",
              label: t("dashboard.totalAum"),
              value: <AnimatedNumber value={m.totalAum} format="compactCurrency" />,
              hint: t("dashboard.acrossAccounts"),
            },
            {
              id: "pnl",
              icon: "/Daily P&L.png",
              label: t("dashboard.dailyPnl"),
              value: (
                <AnimatedNumber
                  value={Math.abs(m.dailyPnL)}
                  format="compactCurrency"
                  prefix={m.dailyPnL >= 0 ? "↗ " : "↘ "}
                />
              ),
              hint: metricsLoading
                ? t("dashboard.markedVsPrior")
                : t("dashboard.vsPriorClose", { pct: pnlPctLabel }),
              valueClassName: m.dailyPnL >= 0 ? "text-[var(--color-positive)]" : "text-loss",
            },
            {
              id: "portfolios",
              icon: "/Active portfolios.png",
              label: t("dashboard.activePortfolios"),
              value: <AnimatedNumber value={m.activeClients} format="integer" />,
              hint: t("dashboard.clientsCount", { count: (customers || []).length }),
            },
            {
              id: "avg",
              icon: "/Avg portfolio.png",
              label: t("dashboard.avgPortfolio"),
              value: <AnimatedNumber value={m.avgPortfolioSize} format="compactCurrency" />,
              hint: t("dashboard.meanAccountSize"),
            },
          ]}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <ChartCard
            title={t("dashboard.aumTrajectory")}
            subtitle={t("dashboard.aumTrajectorySub")}
            action={
              aumDelta == null ? null : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                    aumDelta >= 0 ? "bg-[#edfff8] text-[#139366]" : "bg-[#fff0f1] text-[#e24b57]",
                  )}
                >
                  <ArrowUpRight className={cn("size-3.5", aumDelta < 0 && "rotate-90")} />
                  {t("dashboard.seriesPct", {
                    pct: `${aumDelta >= 0 ? "+" : ""}${aumDelta.toFixed(1)}`,
                  })}
                </span>
              )
            }
          >
            <div className="h-[300px]">
              {trajectoryLoading ? (
                <div className="flex h-full items-end gap-2 px-1">
                  {[40, 65, 50, 80, 60, 90, 70, 100, 85, 95].map((h, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }} />
                  ))}
                </div>
              ) : firmTrend.length === 0 ? (
                <EmptyState title={t("dashboard.emptyAumTitle")} description={t("dashboard.emptyAumDesc")} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={firmTrend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dash-aum-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1760f3" stopOpacity={0.32} />
                        <stop offset="55%" stopColor="#13c5ed" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#13c5ed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dash-aum-stroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#13c5ed" />
                        <stop offset="100%" stopColor="#1760f3" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(119,141,198,0.22)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTickDate}
                      minTickGap={36}
                      tick={{ fill: "#7a879c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => formatCompact(Number(v))}
                      width={44}
                      tick={{ fill: "#7a879c", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      content={
                        <AumTooltip
                          formatQar={formatQar}
                          formatTickDate={formatTickDate}
                          emptyLabel={t("common.na")}
                        />
                      }
                      cursor={{ stroke: "#1760f3", strokeDasharray: "4 4", strokeOpacity: 0.35 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="url(#dash-aum-stroke)"
                      strokeWidth={2.75}
                      fill="url(#dash-aum-fill)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#1760f3" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title={t("dashboard.sectorAlpha")}
            subtitle={t("dashboard.sectorAlphaSub")}
            action={<Link href="/sectors" className={ghostLink}>{t("dashboard.openSectors")}</Link>}
          >
            {sectorsLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="mx-auto size-36 rounded-full" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ) : sectorRows.length === 0 ? (
              <EmptyState title={t("dashboard.emptySectorsTitle")} description={t("dashboard.emptySectorsDesc")} />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div className="relative mx-auto h-[150px] w-full max-w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorMix}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={46}
                        outerRadius={68}
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={3}
                      >
                        {sectorMix.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} ${t("dashboard.signals")}`, name]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #dce4f6",
                          boxShadow: "0 12px 28px rgba(57,82,143,0.14)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-data text-xl font-extrabold text-[#0e1837]">{sectorRows.length}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a879c]">{t("dashboard.signals")}</span>
                  </div>
                </div>

                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorRows} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="rgba(119,141,198,0.18)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fill: "#53678f", fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<SectorTooltip />} cursor={{ fill: "rgba(23,96,243,0.06)" }} />
                      <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={14}>
                        {sectorRows.map((row) => (
                          <Cell key={row.id || row.name} fill={row.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <QuoteBoard
            title={t("dashboard.keyPortfolios")}
            subtitle={t("dashboard.topClients")}
            icon="/Active portfolios.png"
            actionHref="/customers"
            actionLabel={t("dashboard.allClients")}
            columns={{
              asset: t("dashboard.colClient"),
              trend: t("dashboard.colTrend"),
              price: t("dashboard.colValue"),
              day: t("dashboard.colReturn"),
            }}
            loading={customersLoading}
            emptyTitle={t("dashboard.emptyClientsTitle")}
            emptyDescription={t("dashboard.emptyClientsDesc")}
            paginate={false}
            rows={topClients.map((c) => ({
              id: c.id,
              href: `/customers-old/${c.id}`,
              logo: quoteLogoLabel(c.name, 2),
              title: c.name,
              subtitle: c.email || t("common.na"),
              sparkline: sparkFromRange(c.totalInvested, c.currentValue),
              price: <AnimatedNumber value={c.currentValue} format="compactCurrency" />,
              priceCaption: t("common.currencyValue"),
              dayPct: c.returnPct,
            }))}
          />

          <QuoteBoard
            title={t("dashboard.marketNames")}
            subtitle={t("dashboard.latestSecurities")}
            icon="/analytics.png"
            actionHref="/stocks"
            actionLabel={t("dashboard.allStocks")}
            loading={stocksLoading}
            emptyTitle={t("dashboard.emptyStocksTitle")}
            emptyDescription={t("dashboard.emptyStocksDesc")}
            paginate={false}
            rows={marketNames.map((s) => ({
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
