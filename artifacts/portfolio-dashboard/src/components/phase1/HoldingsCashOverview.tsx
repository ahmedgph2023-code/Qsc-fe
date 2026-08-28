import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Briefcase } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { FloatingChip } from "@/components/phase1/ChangeChip";
import { StatsSummaryBar, type StatsSummaryItem } from "@/components/phase1/StatsSummaryBar";

/** How many metrics fit the first row for the current viewport (Home = 4 at xl). */
function useVisibleMetricCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1280px)").matches) setCount(4);
      else if (window.matchMedia("(min-width: 1024px)").matches) setCount(3);
      else if (window.matchMedia("(min-width: 640px)").matches) setCount(2);
      else setCount(1);
    };
    update();
    const mqXl = window.matchMedia("(min-width: 1280px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqSm = window.matchMedia("(min-width: 640px)");
    mqXl.addEventListener("change", update);
    mqLg.addEventListener("change", update);
    mqSm.addEventListener("change", update);
    return () => {
      mqXl.removeEventListener("change", update);
      mqLg.removeEventListener("change", update);
      mqSm.removeEventListener("change", update);
    };
  }, []);

  return count;
}

export function HcoAssetIcon({ src }: { src: string }) {
  return <img src={src} alt="" className="hco-asset-icon" />;
}

/** Legacy card used by Stock/Sector pages — keep API stable. */
export function HcoMetricCard({
  tone,
  icon,
  label,
  value,
  valueTone,
  chip,
  note,
  footer,
  chart,
  compact = false,
}: {
  tone: "accent" | "info" | "gain" | "warn" | "bronze" | "purple" | "cyan";
  icon: ReactNode;
  label: string;
  value: ReactNode;
  valueTone?: "gain" | "loss";
  chip?: ReactNode;
  note?: string;
  footer?: string;
  chart?: ReactNode;
  compact?: boolean;
}) {
  return (
    <article className={cn("hco-card", `hco-card-${tone}`, compact && "hco-card-compact")}>
      <FloatingChip>{chip}</FloatingChip>
      <div className={cn("hco-icon", compact && "is-sm")}>{icon}</div>
      <p className="hco-label">{label}</p>
      <p className={cn("hco-value font-data", compact && "is-sm", valueTone === "gain" && "text-gain", valueTone === "loss" && "text-loss")}>
        {value}
      </p>
      {note && <p className="hco-note">{note}</p>}
      {(chart || footer) && (
        <div className="hco-viz">
          {chart}
          {footer && <p className="hco-foot">{footer}</p>}
        </div>
      )}
    </article>
  );
}

/**
 * Customer Detail top metrics — same StatsSummaryBar pattern as Home.
 * First row size follows viewport; remaining metrics behind Expand.
 */
export function HoldingsCashOverview({
  nav,
  equityMv,
  cashBal,
  openPositions,
  unrealizedPnL,
  realizedPnL,
  twar,
  viewingPast,
  asOf,
  openLotsCost,
  netCashInvested,
  equityDailyChg,
  equityDailyPct,
  excelGrowthPct,
  excelGain,
  moreOpen,
  onMoreOpenChange,
  hideHead = false,
  loading = false,
}: {
  formatCurrency: (val: number) => string;
  nav: number;
  equityMv: number;
  cashBal: number;
  openPositions: number;
  unrealizedPnL: number;
  realizedPnL: number;
  twar: number;
  viewingPast: boolean;
  asOf: string;
  openLotsCost: number;
  netCashInvested: number;
  equityDailyChg: number | null;
  equityDailyPct: number | null;
  excelGrowthPct: number | null | undefined;
  excelGain: number | null | undefined;
  equityHistory: Array<{ date: string; value: number }>;
  twarSeries: Array<number | null>;
  monthlyReturns: Array<{ simpleReturnPct: number }>;
  moreOpen: boolean;
  onMoreOpenChange: (open: boolean) => void;
  hideHead?: boolean;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const visible = useVisibleMetricCount();

  const dailyPctHint =
    equityDailyPct == null || Number.isNaN(Number(equityDailyPct))
      ? t("holdingsOverview.equityDailyNote")
      : `${equityDailyPct >= 0 ? "+" : ""}${equityDailyPct.toFixed(2)}% · ${t("holdingsOverview.vsPriorClose")}`;

  const items: StatsSummaryItem[] = [
    {
      id: "nav",
      icon: "/Holdings + cash.png",
      label: viewingPast ? t("holdingsOverview.navAsOf", { asOf }) : t("holdingsOverview.holdingsPlusCash"),
      value: <AnimatedNumber value={nav} format="currency" loading={loading} />,
      hint: t("holdingsOverview.navNote"),
    },
    {
      id: "equity",
      icon: "/Equity.png",
      label: t("holdingsOverview.equity"),
      value: <AnimatedNumber value={equityMv} format="currency" loading={loading} />,
      hint: t("holdingsOverview.openPositions", { count: openPositions }),
    },
    {
      id: "cash",
      icon: "/Cash-2.png",
      label: t("holdingsOverview.cash"),
      value: <AnimatedNumber value={cashBal} format="currency" loading={loading} />,
      hint: viewingPast ? t("holdingsOverview.ledgerThrough", { asOf }) : t("holdingsOverview.ledgerBalance"),
    },
    {
      id: "daily",
      icon: "/Daily P&L.png",
      label: t("holdingsOverview.equityDailyChg"),
      value: <AnimatedNumber value={equityDailyChg} format="currency" signed loading={loading} />,
      hint: dailyPctHint,
      valueClassName:
        loading || equityDailyChg == null ? undefined : equityDailyChg >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
    {
      id: "unrealized",
      icon: "/Unrealized P&L.png",
      label: t("holdingsOverview.unrealizedPnl"),
      value: <AnimatedNumber value={unrealizedPnL} format="currency" signed loading={loading} />,
      hint: t("holdingsOverview.unrealizedNote"),
      valueClassName: unrealizedPnL >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
    {
      id: "realized",
      icon: "/Realized P&L.png",
      label: t("holdingsOverview.realizedPnl"),
      value: <AnimatedNumber value={realizedPnL} format="currency" signed loading={loading} />,
      hint: t("holdingsOverview.realizedNote"),
      valueClassName: realizedPnL >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
    {
      id: "cost",
      icon: "/Open cost.png",
      label: t("holdingsOverview.openCost"),
      value: <AnimatedNumber value={openLotsCost} format="currency" loading={loading} />,
      hint: t("holdingsOverview.openCostNote"),
    },
    {
      id: "invested",
      icon: "/Net cash invested.png",
      label: t("holdingsOverview.netCashInvested"),
      value: <AnimatedNumber value={netCashInvested} format="currency" loading={loading} />,
      hint: t("holdingsOverview.netCashNote"),
    },
    {
      id: "twar",
      icon: "/analytics.png",
      label: t("holdingsOverview.twar"),
      value: <AnimatedNumber value={twar} format="percent" signed loading={loading} />,
      hint: t("holdingsOverview.twarNote"),
      valueClassName: twar >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
    {
      id: "excel-growth",
      icon: "/growth.png",
      label: t("holdingsOverview.excelEquityGrowth"),
      value: <AnimatedNumber value={excelGrowthPct} format="percent" signed loading={loading} />,
      hint: t("holdingsOverview.excelGrowthNote"),
      valueClassName:
        loading || excelGrowthPct == null ? undefined : excelGrowthPct >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
    {
      id: "excel-gain",
      icon: "/excel.png",
      label: t("holdingsOverview.excelEquityGain"),
      value: <AnimatedNumber value={excelGain} format="currency" signed loading={loading} />,
      hint: t("holdingsOverview.excelGainNote"),
      valueClassName:
        loading || excelGain == null ? undefined : excelGain >= 0 ? "text-[var(--color-positive)]" : "text-loss",
    },
  ];

  const primary = items.slice(0, visible);
  const secondary = items.slice(visible);

  return (
    <section className="hco" aria-label={t("holdingsOverview.ariaLabel")} aria-labelledby={hideHead ? undefined : "hco-title"}>
      {!hideHead && (
        <header className="mb-4 flex items-start gap-3.5">
          <div
            className="grid h-13 w-13 shrink-0 place-items-center rounded-[18px] bg-[linear-gradient(145deg,#eff5ff,#dfe9ff)] text-[#245ee8] shadow-(--cdp-soft,var(--shadow-1))"
            aria-hidden="true"
          >
            <Briefcase className="h-7 w-7" />
          </div>
          <div>
            <h2
              id="hco-title"
              className="text-[clamp(1.35rem,2.4vw,1.75rem)] font-extrabold tracking-tight text-(--cdp-ink,var(--color-text-primary))"
            >
              {t("holdingsOverview.title")}
            </h2>
            <p className="mt-1.5 text-[13px] text-[#50669a]">{t("holdingsOverview.subtitle")}</p>
          </div>
        </header>
      )}

      <StatsSummaryBar
        ariaLabel={t("holdingsOverview.ariaLabel")}
        loading={loading}
        iconSize={64}
        items={primary}
      />

      {secondary.length > 0 && (
        <Collapsible open={moreOpen} onOpenChange={onMoreOpenChange} className="hco-more">
          <CollapsibleContent id="hco-more-metrics" className="hco-more-content">
            <StatsSummaryBar
              ariaLabel={t("holdingsOverview.showMoreMetrics")}
              loading={loading}
              iconSize={56}
              compact
              className="mt-3"
              items={secondary}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
