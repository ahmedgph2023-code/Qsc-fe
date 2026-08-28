import { useTranslation } from "react-i18next";
import { HistoricalPortfolioDashboard } from "@/components/phase1/HistoricalPortfolioDashboard";
import { WorkbookKpiBar } from "@/components/phase1/WorkbookKpiBar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientHoldingsViewModel } from "@/lib/clientHoldingsModel";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

export function ClientHoldingsStation({
  model,
  variant = "full",
  loading = false,
  showSourceHints = false,
}: {
  model: ClientHoldingsViewModel;
  variant?: "full" | "kpis" | "table";
  loading?: boolean;
  showSourceHints?: boolean;
}) {
  const { t } = useTranslation();
  const showKpis = variant === "full" || variant === "kpis";
  const showTable = variant === "full" || variant === "table";

  return (
    <div className="space-y-4">
      {showKpis ? (
        <>
          <dl className="grid gap-3 sm:grid-cols-2 max-w-xl text-sm">
            <div className="rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-start">
              <dt className="text-[10px] font-semibold text-muted-foreground">{t("historicalPortfolio.clientN")}</dt>
              <dd className="mt-1 font-semibold break-all" dir="ltr">
                {loading && !model.clientCode ? <Skeleton className="inline-block h-5 w-24" /> : (model.clientCode || "—")}
              </dd>
            </div>
            <div className="rounded-md border border-border/70 bg-muted/10 px-3 py-2 text-start">
              <dt className="text-[10px] font-semibold text-muted-foreground">{t("historicalPortfolio.clientName")}</dt>
              <dd className="mt-1 font-semibold break-all">
                {loading && !model.clientName ? <Skeleton className="inline-block h-5 w-40" /> : (model.clientName || "—")}
              </dd>
            </div>
          </dl>
          <WorkbookKpiBar
            nav={model.nav}
            growthPct={model.excelGrowthPct}
            gain={model.excelGain}
            indexPct={model.indexPerformancePct}
            indexName={model.indexName}
            indexFromDate={model.indexFromDate}
            indexToDate={model.indexToDate}
            loading={loading}
            showSourceHints={showSourceHints}
          />
        </>
      ) : null}
      {showTable ? (
        <HistoricalPortfolioDashboard
          formatCurrency={formatCurrency}
          holdings={model.holdings}
          cashBal={model.cashBal}
          cashWeight={model.cashWeight}
          cashOpenedOn={model.cashOpenedOn}
          cashHoldingDays={model.cashHoldingDays}
          navWeightByStock={model.navWeightByStock}
          sectors={model.sectors}
          dailyChanges={model.dailyChanges}
          loading={loading}
          portfolioId={model.portfolioId}
          showSourceHints={showSourceHints}
        />
      ) : null}
    </div>
  );
}
