import { useTranslation } from "react-i18next";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";

function formatSignedPct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Sheet1 header KPIs: Value / Growth / Index / QAR Gain. */
export function WorkbookKpiBar({
  nav,
  growthPct,
  gain,
  indexPct,
  indexName,
  indexFromDate,
  indexToDate,
  loading = false,
  showSourceHints = false,
}: {
  nav: number;
  growthPct: number | null | undefined;
  gain: number | null | undefined;
  indexPct: number | null | undefined;
  indexName?: string | null;
  indexFromDate?: string | null;
  indexToDate?: string | null;
  loading?: boolean;
  showSourceHints?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <StatsSummaryBar
      ariaLabel={t("historicalPortfolio.ariaLabel")}
      loading={loading}
      iconSize={56}
      items={[
        {
          id: "value",
          icon: "/Holdings + cash.png",
          label: t("historicalPortfolio.portfolioValue"),
          value: <AnimatedNumber value={nav} format="currency" loading={loading} />,
          hint: t("historicalPortfolio.portfolioValueNote"),
          info: showSourceHints ? t("historicalPortfolio.source.portfolioValue") : undefined,
        },
        {
          id: "growth",
          icon: "/growth.png",
          label: t("historicalPortfolio.portfolioGrowth"),
          value: <AnimatedNumber value={growthPct} format="percent" signed loading={loading} />,
          hint: t("historicalPortfolio.portfolioGrowthNote"),
          info: showSourceHints ? t("historicalPortfolio.source.portfolioGrowth") : undefined,
          valueClassName:
            loading || growthPct == null ? undefined : growthPct >= 0 ? "text-[var(--color-positive)]" : "text-loss",
        },
        {
          id: "index",
          icon: "/finance.png",
          label: t("historicalPortfolio.indexPerformance"),
          value: loading ? "…" : formatSignedPct(indexPct),
          hint: indexName
            ? t("historicalPortfolio.indexPerformanceHint", {
              name: indexName,
              from: indexFromDate ?? "—",
              to: indexToDate ?? "—",
            })
            : t("historicalPortfolio.indexPerformanceNote"),
          info: showSourceHints ? t("historicalPortfolio.source.indexPerformance") : undefined,
          valueClassName:
            indexPct == null ? undefined : indexPct >= 0 ? "text-[var(--color-positive)]" : "text-loss",
        },
        {
          id: "gain",
          icon: "/excel.png",
          label: t("historicalPortfolio.portfolioQarGain"),
          value: <AnimatedNumber value={gain} format="currency" signed loading={loading} />,
          hint: t("historicalPortfolio.portfolioQarGainNote"),
          info: showSourceHints ? t("historicalPortfolio.source.portfolioQarGain") : undefined,
          valueClassName:
            loading || gain == null ? undefined : gain >= 0 ? "text-[var(--color-positive)]" : "text-loss",
        },
      ]}
    />
  );
}
