import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Check, Percent, X } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState, StatTile } from "@/components/phase1/PageHeader";
import { ReasonDialog } from "@/components/phase1/ReasonDialog";
import { SelectField } from "@/components/phase1/SelectField";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, CLIENT_PAGE_SIZES } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import {
  approveFeeCharge,
  bulkApproveFeeCharges,
  bulkRejectFeeCharges,
  generateFeeCharges,
  getFeeCharges,
  getFeeSummary,
  getPortfolioManager,
  rejectFeeCharge,
  type FeeCharge,
  type FeeChargeStatus,
  type FeeChargeType,
} from "@/lib/api";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

function statusClass(status: FeeChargeStatus) {
  if (status === "approved") return "bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-[var(--color-positive)]/20";
  if (status === "rejected") return "bg-[var(--color-negative-soft)] text-[var(--color-negative)] border-[var(--color-negative)]/20";
  return "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/20";
}

export default function Fees() {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canGenerate = canPerformAction("fee.generate", { role, username });
  const canDecide = canPerformAction("fee.approve", { role, username });
  const client = useQueryClient();

  const typeLabel = (type: FeeChargeType) => {
    if (type === "rebate_commission") return t("fees.typeRebate");
    if (type === "management_fee") return t("fees.typeManagement");
    if (type === "performance_fee") return t("fees.typePerformance");
    return type;
  };

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZES[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [decide, setDecide] = useState<{
    mode: "approve" | "reject";
    ids: string[];
  } | null>(null);
  const [genPortfolioId, setGenPortfolioId] = useState("");

  const { data: portfolios = [] } = useQuery({
    queryKey: ["portfolio-manager"],
    queryFn: () => getPortfolioManager(),
  });
  const { data: summary } = useQuery({
    queryKey: ["fee-summary"],
    queryFn: getFeeSummary,
  });
  const { data: chargesPage, isLoading } = useQuery({
    queryKey: ["fee-charges", status, type, customerId, search, from, to, page, pageSize],
    queryFn: () => getFeeCharges({
      status: status || undefined,
      type: type || undefined,
      customerId: customerId || undefined,
      search: search || undefined,
      from: from ? `${from}-01` : undefined,
      to: to ? `${to}-01` : undefined,
      page,
      pageSize,
    }),
  });

  const rows = chargesPage?.data || [];
  const pagination = chargesPage?.pagination;
  const pendingOnPage = rows.filter((r) => r.status === "pending");
  const allPendingSelected = pendingOnPage.length > 0 && pendingOnPage.every((r) => selected.includes(r.id));

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["fee-charges"] });
    client.invalidateQueries({ queryKey: ["fee-summary"] });
    client.invalidateQueries({ queryKey: ["fee-pending"] });
    client.invalidateQueries({ queryKey: ["portfolio-cash"] });
  };

  const genMut = useMutation({
    mutationFn: () => generateFeeCharges({ portfolioId: genPortfolioId || undefined }),
    onSuccess: () => { setError(""); setSelected([]); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const decideMut = useMutation({
    mutationFn: async ({ ids, mode, reason }: { ids: string[]; mode: "approve" | "reject"; reason: string }) => {
      if (ids.length === 1) {
        return mode === "approve" ? approveFeeCharge(ids[0], reason) : rejectFeeCharge(ids[0], reason);
      }
      return mode === "approve" ? bulkApproveFeeCharges(ids, reason) : bulkRejectFeeCharges(ids, reason);
    },
    onSuccess: () => { setDecide(null); setSelected([]); setError(""); refresh(); },
    onError: (e: Error) => setError(e.message),
  });

  const selectedPending = useMemo(
    () => rows.filter((r) => selected.includes(r.id) && r.status === "pending"),
    [rows, selected],
  );

  function toggle(id: string, on: boolean) {
    setSelected((cur) => (on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id)));
  }

  function toggleAllPending(on: boolean) {
    const ids = pendingOnPage.map((r) => r.id);
    setSelected((cur) => {
      if (on) return [...new Set([...cur, ...ids])];
      return cur.filter((id) => !ids.includes(id));
    });
  }

  return (
    <Shell>
      <PageHeader
        title={t("fees.title")}
        description={t("fees.description")}
        meta={
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300">
            {t("common.pendingCount", { count: summary?.pendingCount ?? 0 })}
          </span>
        }
      />
      {error && <p className="error-banner">{error}</p>}

      <div className="metric-strip stagger">
        <StatTile label={t("fees.managementEarned")} value={Number(summary?.managementEarned || 0)} format="currency" tone="gold" icon={<Percent className="h-4 w-4" />} />
        <StatTile label={t("fees.performanceEarned")} value={Number(summary?.performanceEarned || 0)} format="currency" tone="gold" />
        <StatTile label={t("fees.rebatePaid")} value={Number(summary?.rebatePaid || 0)} format="currency" tone="gain" />
        <StatTile label={t("common.pending")} value={summary?.pendingCount ?? 0} tone="warn" hint={formatCurrency(summary?.pendingAmount || 0)} />
      </div>

      <FilterBar>
        <SelectField
          className="min-w-48"
          value={customerId}
          onValueChange={(v) => { setCustomerId(v); setPage(1); }}
          aria-label={t("common.client")}
          options={[{ value: "", label: t("dashboard.allClients") }, ...portfolios.map((p) => ({ value: p.customerId, label: p.customerName }))]}
        />
        <SelectField
          className="w-40"
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
          aria-label={t("common.status")}
          options={[
            { value: "", label: t("common.allStatuses") },
            { value: "pending", label: t("common.pending") },
            { value: "approved", label: t("common.approved") },
            { value: "rejected", label: t("common.rejected") },
          ]}
        />
        <SelectField
          className="w-44"
          value={type}
          onValueChange={(v) => { setType(v); setPage(1); }}
          aria-label={t("fees.feeType")}
          options={[
            { value: "", label: t("common.allTypes") },
            { value: "rebate_commission", label: t("fees.typeRebate") },
            { value: "management_fee", label: t("fees.typeManagement") },
            { value: "performance_fee", label: t("fees.typePerformance") },
          ]}
        />
        <Input
          className="control max-w-56"
          placeholder={t("fees.searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Input type="month" className="control w-40" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <Input type="month" className="control w-40" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        {canGenerate && (
          <>
            <SelectField
              className="min-w-48"
              value={genPortfolioId}
              onValueChange={setGenPortfolioId}
              aria-label={t("fees.generateFor")}
              options={[{ value: "", label: t("fees.previousMonthAll") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: t("fees.allMonths", { name: p.customerName }) }))]}
            />
            <Button size="sm" variant="outline" disabled={genMut.isPending} onClick={() => genMut.mutate()}>
              <Calculator className="me-1 h-3 w-3" />
              {t("fees.calculate")}
            </Button>
          </>
        )}
      </FilterBar>

      {canDecide && selectedPending.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{t("common.selectedCount", { count: selectedPending.length })}</span>
          <Button size="sm" onClick={() => setDecide({ mode: "approve", ids: selectedPending.map((r) => r.id) })}>
            <Check className="me-1 h-3 w-3" /> {t("common.approve")}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDecide({ mode: "reject", ids: selectedPending.map((r) => r.id) })}>
            <X className="me-1 h-3 w-3" /> {t("common.reject")}
          </Button>
          <p className="text-[11px] text-muted-foreground">{t("fees.approveOrderHint")}</p>
        </div>
      )}

      {!isLoading && rows.length === 0 ? (
        <EmptyState
          title={t("fees.emptyTitle")}
          description={t("fees.emptyDesc")}
        />
      ) : (
        <AppTable
            footer={
              pagination ? (
                <TablePageFooter
                  total={pagination.total}
                  page={pagination.page}
                  pageSize={pageSize}
                  pageSizes={CLIENT_PAGE_SIZES}
                  loading={isLoading}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                />
              ) : undefined
            }
        >
            <TableHeader>
              <TableRow>
                {canDecide && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allPendingSelected}
                      onCheckedChange={(v) => toggleAllPending(v === true)}
                      aria-label={t("fees.selectPending")}
                    />
                  </TableHead>
                )}
                <TableHead>{t("common.client")}</TableHead>
                <TableHead>{t("common.period")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead className="text-end">{t("common.base")}</TableHead>
                <TableHead className="text-end">{t("common.rate")}</TableHead>
                <TableHead className="text-end">{t("common.amount")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                {canDecide && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: FeeCharge) => {
                const base = r.type === "rebate_commission" ? r.notional : r.nav;
                return (
                  <TableRow key={r.id}>
                    {canDecide && (
                      <TableCell>
                        {r.status === "pending" && (
                          <Checkbox
                            checked={selected.includes(r.id)}
                            onCheckedChange={(v) => toggle(r.id, v === true)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Link href={`/customers-old/${r.customerId}`} className="soft-link font-medium">
                        {r.customerName || r.customerId.slice(0, 8)}
                      </Link>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.accountNumber || t("common.na")}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{String(r.periodEndDate).slice(0, 10)}</TableCell>
                    <TableCell className="font-mono text-sm">{typeLabel(r.type)}</TableCell>
                    <TableCell className="text-end font-data">{formatCurrency(base)}</TableCell>
                    <TableCell className="text-end font-data">{Number(r.ratePct).toFixed(3)}%</TableCell>
                    <TableCell className={`text-end font-data font-bold ${r.type === "rebate_commission" ? "text-emerald-400" : ""}`}>
                      {r.type === "rebate_commission" ? "+" : "−"}{formatCurrency(Math.abs(r.amount))}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    {canDecide && (
                      <TableCell className="text-end">
                        {r.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setDecide({ mode: "approve", ids: [r.id] })}>{t("common.approve")}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setDecide({ mode: "reject", ids: [r.id] })}>{t("common.reject")}</Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
        </AppTable>
      )}

      <ReasonDialog
        open={!!decide}
        onOpenChange={(v) => { if (!v) setDecide(null); }}
        title={decide?.mode === "approve" ? t("fees.approveTitle") : t("fees.rejectTitle")}
        description={
          decide?.mode === "approve"
            ? t("fees.approveDesc")
            : t("fees.rejectDesc")
        }
        confirmLabel={decide?.mode === "approve" ? t("common.approve") : t("common.reject")}
        requireReason={decide?.mode === "reject"}
        destructive={decide?.mode === "reject"}
        pending={decideMut.isPending}
        onConfirm={(reason) => {
          if (!decide) return;
          decideMut.mutate({ ids: decide.ids, mode: decide.mode, reason });
        }}
      />
    </Shell>
  );
}
