import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { SelectField } from "@/components/phase1/SelectField";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { getPortfolioManager, getRebalances } from "@/lib/api";

const TRIGGER_KEYS = ["ad_hoc", "threshold", "scheduled", "mandate_change", "cash_flow"] as const;
const STATUS_KEYS = ["draft", "approved", "executed", "final", "cancelled"] as const;

export default function Rebalances() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [trigger, setTrigger] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolio-manager"], queryFn: () => getPortfolioManager() });
  const { data = [], isLoading } = useQuery({
    queryKey: ["rebalances", status, trigger, portfolioId],
    queryFn: () => getRebalances({ status, trigger, portfolioId }),
  });
  const paging = useClientTablePage(data, `${status}|${trigger}|${portfolioId}`);
  const nameFor = (id?: string | null) =>
    portfolios.find((p) => p.portfolioId === id)?.customerName || (id ? id.slice(0, 12) : t("common.model"));

  const draft = data.filter((r: any) => r.lockStatus === "draft").length;
  const pending = data.filter((r: any) => ["draft", "approved"].includes(r.lockStatus)).length;
  const final = data.filter((r: any) => r.lockStatus === "final").length;

  const triggerLabel = (key: string) => {
    const k = `common.triggers.${key}` as const;
    const translated = t(k);
    return translated === k ? key.replaceAll("_", " ") : translated;
  };

  const statusLabel = (key: string) => {
    const map: Record<string, string> = {
      draft: t("common.draft"),
      approved: t("common.approved"),
      executed: t("common.executed"),
      final: t("common.final"),
      cancelled: t("common.cancelled"),
    };
    return map[key] || key;
  };

  return (
    <Shell>
      <PageHeader
        title={t("rebalances.title")}
        description={t("rebalances.description")}
        meta={
          <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("common.inRegisterCount", { count: data.length })}
          </span>
        }
      />

      <StatsSummaryBar
        className="mb-6"
        ariaLabel={t("rebalances.title")}
        loading={isLoading}
        items={[
          {
            id: "register",
            icon: "/Builder workflow.png",
            label: t("rebalances.inRegister"),
            value: <AnimatedNumber value={data.length} format="integer" />,
            hint: "",
          },
          {
            id: "draft",
            icon: "/file.png",
            label: t("rebalances.draft"),
            value: <AnimatedNumber value={draft} format="integer" />,
            hint: t("common.draft"),
          },
          {
            id: "flight",
            icon: "/broadcast.png",
            label: t("rebalances.inFlight"),
            value: <AnimatedNumber value={pending} format="integer" />,
            hint: t("common.approved"),
          },
          {
            id: "final",
            icon: "/check.png",
            label: t("rebalances.finalLocked"),
            value: <AnimatedNumber value={final} format="integer" />,
            hint: t("common.final"),
            valueClassName: "text-[var(--color-positive)]",
          },
        ]}
      />

      <FilterBar>
        <SelectField
          className="w-52"
          value={portfolioId}
          onValueChange={setPortfolioId}
          aria-label={t("common.client")}
          options={[{ value: "", label: t("dashboard.allClients") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: p.customerName }))]}
        />
        <SelectField
          className="w-48"
          value={trigger}
          onValueChange={setTrigger}
          aria-label={t("common.trigger")}
          options={[{ value: "", label: t("common.allTriggers") }, ...TRIGGER_KEYS.map((key) => ({ value: key, label: triggerLabel(key) }))]}
        />
        <SelectField
          className="w-44"
          value={status}
          onValueChange={setStatus}
          aria-label={t("common.status")}
          options={[{ value: "", label: t("common.allStatuses") }, ...STATUS_KEYS.map((s) => ({ value: s, label: statusLabel(s) }))]}
        />
      </FilterBar>

      {!isLoading && data.length === 0 ? (
        <EmptyState
          title={t("rebalances.emptyTitle")}
          description={t("rebalances.emptyDesc")}
          action={<Link href="/builder" className="soft-link text-gold">{t("rebalances.openBuilder")}</Link>}
        />
      ) : (
        <AppTable
          footer={
            <TablePageFooter
              total={paging.total}
              page={paging.page}
              pageSize={paging.pageSize}
              pageSizes={paging.pageSizes}
              loading={isLoading}
              onPageChange={paging.setPage}
              onPageSizeChange={paging.setPageSize}
            />
          }
        >
            <TableHeader>
              <TableRow>
                <TableHead>{t("rebalances.colReference")}</TableHead>
                <TableHead>{t("rebalances.colTrigger")}</TableHead>
                <TableHead>{t("rebalances.colStatus")}</TableHead>
                <TableHead>{t("rebalances.colClient")}</TableHead>
                <TableHead>{t("rebalances.colProposed")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows cols={6} />
              ) : paging.paged.map((r: any) => (
                <TableRow key={r.id} className="group">
                  <TableCell className="font-mono font-semibold">{r.rebalanceCode}</TableCell>
                  <TableCell className="capitalize">{triggerLabel(String(r.trigger))}</TableCell>
                  <TableCell><MandateBadge value={r.lockStatus} /></TableCell>
                  <TableCell>{nameFor(r.portfolioId)}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(r.proposedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Link href={`/rebalances/${r.id}`} className="inline-flex rounded-md border border-transparent p-1.5 transition group-hover:border-gold/30 group-hover:bg-gold/5">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </AppTable>
      )}
    </Shell>
  );
}
