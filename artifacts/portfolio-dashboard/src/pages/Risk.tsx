import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radar, UserCheck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { SeverityDot } from "@/components/phase1/SeverityDot";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { ReasonDialog } from "@/components/phase1/ReasonDialog";
import { SelectField } from "@/components/phase1/SelectField";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { Button } from "@/components/ui/button";
import {
  assignRiskAlert, getPortfolioManager, getRiskAlerts, getRiskConfig,
  resolveRiskAlert, scanRisk, waiveRiskAlert,
} from "@/lib/api";

export default function Risk() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("open");
  const [portfolioId, setPortfolioId] = useState("");
  const [action, setAction] = useState<{ id: string; type: "resolve" | "waive" } | null>(null);
  const [error, setError] = useState("");
  const { role, userId, username } = useAuth();
  const canScan = canPerformAction("risk.scan", { role, username });
  const canResolve = canPerformAction("risk.resolve", { role, username });
  const canWaive = canPerformAction("risk.waive", { role, username });
  const client = useQueryClient();
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolio-manager"], queryFn: () => getPortfolioManager() });
  const { data: alerts = [] } = useQuery({
    queryKey: ["risk-alerts", status, portfolioId],
    queryFn: () => getRiskAlerts({ status, portfolioId }),
  });
  const { data: config = [] } = useQuery({ queryKey: ["risk-config"], queryFn: getRiskConfig });

  const refresh = () => client.invalidateQueries({ queryKey: ["risk-alerts"] });
  const scanMut = useMutation({
    mutationFn: () => scanRisk(portfolioId || undefined),
    onSuccess: () => { setError(""); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const actionMut = useMutation({
    mutationFn: ({ id, type, note }: { id: string; type: "resolve" | "waive"; note: string }) =>
      type === "resolve" ? resolveRiskAlert(id, note) : waiveRiskAlert(id, note),
    onSuccess: () => { setAction(null); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const assignMut = useMutation({
    mutationFn: (id: string) => assignRiskAlert(id, userId),
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  const portfolioName = (id: string) => portfolios.find((p) => p.portfolioId === id)?.customerName || id.slice(0, 12);
  const isOverdue = (due?: string | null) => due && new Date(due) < new Date();
  const critical = alerts.filter((a: any) => a.severity === "critical" && a.status === "open").length;
  const overdue = alerts.filter((a: any) => a.status === "open" && isOverdue(a.dueDate)).length;

  return (
    <Shell>
      <PageHeader
        title={t("risk.title")}
        description={t("risk.description")}
        meta={
          <>
            <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-rose-400">
              {t("common.criticalCount", { count: critical })}
            </span>
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("common.overdueCount", { count: overdue })}
            </span>
          </>
        }
      />
      {error && <p className="error-banner">{error}</p>}

      {config.length > 0 ? (
        <StatsSummaryBar
          className="mb-6"
          ariaLabel={t("risk.title")}
          items={config.slice(0, 4).map((c: { key: string; value: string | number }, i: number) => ({
            id: c.key,
            icon: ["/warning.png", "/security.png", "/analytics.png", "/layers.png"][i] || "/warning.png",
            label: c.key.replaceAll("_", " "),
            value: Number(c.value) <= 1 ? `${(Number(c.value) * 100).toFixed(0)}%` : String(c.value),
            hint: "",
          }))}
        />
      ) : null}

      <FilterBar>
        <SelectField
          className="w-56"
          value={portfolioId}
          onValueChange={setPortfolioId}
          aria-label={t("common.portfolio")}
          options={[{ value: "", label: t("common.allPortfolios") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: p.customerName }))]}
        />
        <SelectField
          className="w-44"
          value={status}
          onValueChange={setStatus}
          aria-label={t("risk.alertStatus")}
          options={[
            { value: "", label: t("common.allAlerts") },
            { value: "open", label: t("common.open") },
            { value: "resolved", label: t("common.resolved") },
            { value: "waived", label: t("common.waived") },
          ]}
        />
        {canScan ? (
          <Button loading={scanMut.isPending} onClick={() => scanMut.mutate()}>
            <Radar className="h-4 w-4" />{portfolioId ? t("risk.scanPortfolio") : t("risk.scanAll")}
          </Button>
        ) : null}
      </FilterBar>

      <div className="grid gap-3 stagger">
        {alerts.length ? alerts.map((a: any) => (
          <div
            key={a.id}
            className={`alert-card ${
              a.severity === "critical" ? "alert-card-critical" :
              a.severity === "warning" ? "alert-card-warning" : "alert-card-info"
            } ${isOverdue(a.dueDate) && a.status === "open" ? "bg-rose-500/5" : ""}`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <SeverityDot severity={a.severity} />
              <span className="text-base font-medium capitalize">{String(a.alertType).replaceAll("_", " ")}</span>
              {isOverdue(a.dueDate) && a.status === "open" && (
                <span className="rounded border border-rose-500/40 px-2 py-0.5 font-mono text-[10px] uppercase text-rose-400">{t("common.overdue")}</span>
              )}
              <span className="ms-auto"><MandateBadge value={a.status} /></span>
            </div>
            <div className="mb-3 flex flex-wrap gap-5 font-mono text-xs text-muted-foreground">
              <span>{portfolioName(a.portfolioId)}</span>
              {a.sector && <span>{t("risk.sectorValue", { sector: a.sector })}</span>}
              <span>{t("risk.valueLabel", { value: a.metricValue ?? t("common.na") })}</span>
              <span>{t("risk.limitLabel", { limit: a.threshold ?? t("common.na") })}</span>
              {a.dueDate && <span>{t("risk.dueLabel", { date: a.dueDate })}</span>}
              {a.ownerId && <span>{t("risk.ownerLabel", { id: String(a.ownerId).slice(0, 8) })}</span>}
            </div>
            {a.resolutionNotes && <p className="mb-3 text-sm text-muted-foreground">{a.resolutionNotes}</p>}
            {a.status === "open" && (canResolve || canWaive) && (
              <div className="flex flex-wrap gap-2">
                {canResolve ? (
                  <Button size="sm" variant="outline" disabled={assignMut.isPending} onClick={() => assignMut.mutate(a.id)}>
                    <UserCheck className="me-1 h-3 w-3" />{t("risk.assignToMe")}
                  </Button>
                ) : null}
                {canResolve ? (
                  <Button size="sm" onClick={() => setAction({ id: a.id, type: "resolve" })}>{t("common.resolve")}</Button>
                ) : null}
                {canWaive ? (
                  <Button size="sm" variant="outline" onClick={() => setAction({ id: a.id, type: "waive" })}>{t("common.waive")}</Button>
                ) : null}
              </div>
            )}
          </div>
        )) : (
          <EmptyState
            title={t("risk.emptyTitle")}
            description={t("risk.emptyDesc")}
            action={
              canScan ? (
                <Button disabled={scanMut.isPending} onClick={() => scanMut.mutate()}>
                  <Radar className="me-2 h-4 w-4" />{t("risk.scanNow")}
                </Button>
              ) : undefined
            }
          />
        )}
      </div>

      <ReasonDialog
        open={!!action}
        onOpenChange={(open) => !open && setAction(null)}
        title={action?.type === "waive" ? t("risk.waiveTitle") : t("risk.resolveTitle")}
        description={action?.type === "waive" ? t("risk.waiveDesc") : t("risk.resolveDesc")}
        confirmLabel={action?.type === "waive" ? t("common.waive") : t("common.resolve")}
        destructive={action?.type === "waive"}
        pending={actionMut.isPending}
        onConfirm={(note) => { if (action) actionMut.mutate({ id: action.id, type: action.type, note }); }}
      />
    </Shell>
  );
}
