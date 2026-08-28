import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { ReasonDialog } from "@/components/phase1/ReasonDialog";
import { SelectField } from "@/components/phase1/SelectField";
import { DatePicker } from "@/components/phase1/DatePicker";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import {
  createComplianceException, decideComplianceException, getComplianceExceptions,
  getComplianceResults, getPortfolioManager, runCompliance,
} from "@/lib/api";

const CHECK_CODES = [
  "SHARIAH_UNIVERSE",
  "SECTOR_LIMIT",
  "STOCK_LIMIT",
  "RESTRICTION",
  "ILLIQUID",
  "WEIGHT_SUM",
  "CASH_FLOOR",
  "OTHER",
];

export default function Compliance() {
  const { t } = useTranslation();
  const [portfolioId, setPortfolioId] = useState("");
  const [checkCode, setCheckCode] = useState(CHECK_CODES[0]);
  const [reason, setReason] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [decide, setDecide] = useState<{ id: string; decision: "approve" | "reject" } | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("results");
  const { role, username } = useAuth();
  const client = useQueryClient();
  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolio-manager"], queryFn: () => getPortfolioManager() });
  const { data: results = [] } = useQuery({ queryKey: ["compliance-results", portfolioId], queryFn: () => getComplianceResults(portfolioId || undefined) });
  const { data: exceptions = [] } = useQuery({ queryKey: ["compliance-exceptions"], queryFn: () => getComplianceExceptions() });
  const resultsPaging = useClientTablePage(results, portfolioId);

  const runMut = useMutation({
    mutationFn: () => runCompliance({ portfolioId, timing: "before_proposal" }),
    onSuccess: () => { setError(""); client.invalidateQueries({ queryKey: ["compliance-results"] }); },
    onError: (e: Error) => setError(e.message),
  });
  const createMut = useMutation({
    mutationFn: () => createComplianceException({ portfolioId, checkCode, reason, validUntil: validUntil || null }),
    onSuccess: () => {
      setReason("");
      setValidUntil("");
      setError("");
      client.invalidateQueries({ queryKey: ["compliance-exceptions"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const decideMut = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "approve" | "reject"; note: string }) =>
      decideComplianceException(id, decision, note),
    onSuccess: () => {
      setDecide(null);
      client.invalidateQueries({ queryKey: ["compliance-exceptions"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const canDecide = ["admin", "approver", "compliance"].includes(role || "");
  const canRun = canPerformAction("compliance.run", { role, username });
  const canRequest = canPerformAction("compliance.exception", { role, username });
  const openCount = exceptions.filter((e: any) => e.status === "requested").length;
  const passCount = results.filter((r: any) => r.result === "pass").length;
  const failCount = results.filter((r: any) => r.result === "fail").length;

  return (
    <Shell>
      <PageHeader
        title={t("compliance.title")}
        description={t("compliance.description")}
        meta={
          <>
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("common.resultsCount", { count: results.length })}
            </span>
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300">
              {t("common.openExceptionsCount", { count: openCount })}
            </span>
          </>
        }
      />
      {error && <p className="error-banner">{error}</p>}

      <StatsSummaryBar
        className="mb-6"
        ariaLabel={t("compliance.title")}
        items={[
          {
            id: "checks",
            icon: "/Compliant.png",
            label: t("compliance.checksRun"),
            value: <AnimatedNumber value={results.length} format="integer" />,
            hint: "",
          },
          {
            id: "pass",
            icon: "/check.png",
            label: t("compliance.passed"),
            value: <AnimatedNumber value={passCount} format="integer" />,
            hint: "",
            valueClassName: "text-[var(--color-positive)]",
          },
          {
            id: "fail",
            icon: "/warning.png",
            label: t("compliance.failed"),
            value: <AnimatedNumber value={failCount} format="integer" />,
            hint: "",
            valueClassName: failCount ? "text-loss" : undefined,
          },
          {
            id: "exceptions",
            icon: "/info.png",
            label: t("compliance.openExceptions"),
            value: <AnimatedNumber value={openCount} format="integer" />,
            hint: "",
            valueClassName: openCount ? "text-[var(--color-warning)]" : undefined,
          },
        ]}
      />

      <FilterBar>
        <SelectField
          className="min-w-64"
          value={portfolioId}
          onValueChange={setPortfolioId}
          aria-label={t("common.portfolio")}
          options={[{ value: "", label: t("common.allPortfolios") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: p.customerName }))]}
        />
        <Button loading={runMut.isPending} disabled={!portfolioId || !canRun} onClick={() => runMut.mutate()}>
          <Play className="h-4 w-4" />{t("compliance.runChecks")}
        </Button>
      </FilterBar>

      <Tabs value={tab} onValueChange={setTab} className="cdp-data">
        <CdpTabsList value={tab} className="mb-5">
          <TabsTrigger value="results" className={CDP_TAB}>{t("compliance.tabResults")}</TabsTrigger>
          <TabsTrigger value="exceptions" className={CDP_TAB}>{t("compliance.tabExceptions", { count: openCount })}</TabsTrigger>
          {canRequest && <TabsTrigger value="request" className={CDP_TAB}>{t("compliance.tabRequest")}</TabsTrigger>}
        </CdpTabsList>

        <TabsContent value="results">
          {results.length ? (
            <AppTable
              footer={
                <TablePageFooter
                  total={resultsPaging.total}
                  page={resultsPaging.page}
                  pageSize={resultsPaging.pageSize}
                  pageSizes={resultsPaging.pageSizes}
                  onPageChange={resultsPaging.setPage}
                  onPageSizeChange={resultsPaging.setPageSize}
                />
              }
            >
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("compliance.colCheck")}</TableHead>
                    <TableHead>{t("compliance.colTiming")}</TableHead>
                    <TableHead>{t("compliance.colResult")}</TableHead>
                    <TableHead>{t("compliance.colMessage")}</TableHead>
                    <TableHead>{t("compliance.colCreated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultsPaging.paged.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.checkCode}</TableCell>
                      <TableCell className="capitalize">{String(r.timing).replaceAll("_", " ")}</TableCell>
                      <TableCell><MandateBadge value={r.result} /></TableCell>
                      <TableCell className="max-w-lg text-muted-foreground">{r.message || r.reasonCode}</TableCell>
                      <TableCell className="font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </AppTable>
          ) : (
            <EmptyState
              title={t("compliance.emptyTitle")}
              description={t("compliance.emptyDesc")}
            />
          )}
        </TabsContent>

        <TabsContent value="exceptions">
          <div className="grid gap-3 stagger">
            {exceptions.length ? exceptions.map((e: any) => (
              <div key={e.id} className="alert-card alert-card-warning">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  <span className="font-medium">{e.checkCode}</span>
                  <span className="ms-auto"><MandateBadge value={e.status} /></span>
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{e.reason}</p>
                <div className="mb-3 flex flex-wrap gap-4 font-mono text-xs text-muted-foreground">
                  <span>{t("compliance.portfolioLabel", { id: String(e.portfolioId).slice(0, 12) })}</span>
                  {e.validUntil && <span>{t("compliance.validUntil", { date: e.validUntil })}</span>}
                  <span>{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                {canDecide && e.status === "requested" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setDecide({ id: e.id, decision: "approve" })}>{t("common.approve")}</Button>
                    <Button size="sm" variant="destructive" onClick={() => setDecide({ id: e.id, decision: "reject" })}>{t("common.reject")}</Button>
                  </div>
                )}
              </div>
            )) : (
              <EmptyState
                title={t("compliance.emptyExceptionsTitle")}
                description={t("compliance.emptyExceptionsDesc")}
              />
            )}
          </div>
        </TabsContent>

        {canRequest && (
          <TabsContent value="request">
            <Card className="border-border/70 bg-card/90">
              <CardHeader><CardTitle className="display-font text-2xl">{t("compliance.requestTitle")}</CardTitle></CardHeader>
              <CardContent className="grid max-w-xl gap-4">
                <div className="space-y-2">
                  <Label>{t("common.portfolio")}</Label>
                  <SelectField
                    className="w-full"
                    value={portfolioId}
                    onValueChange={setPortfolioId}
                    placeholder={t("common.selectPortfolio")}
                    options={[{ value: "", label: t("common.selectPortfolio") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: p.customerName }))]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("compliance.checkCode")}</Label>
                  <SelectField
                    className="w-full"
                    value={checkCode}
                    onValueChange={setCheckCode}
                    options={CHECK_CODES.map((c) => ({ value: c, label: c }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("compliance.reasonRequired")}</Label>
                  <Input placeholder={t("compliance.reasonPlaceholder")} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("compliance.validUntilLabel")}</Label>
                  <DatePicker value={validUntil} onChange={setValidUntil} placeholder={t("compliance.validUntilLabel")} />
                </div>
                <Button loading={createMut.isPending} disabled={!portfolioId || !reason.trim()} onClick={() => createMut.mutate()}>
                  <Plus className="h-4 w-4" />{t("compliance.submitRequest")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <ReasonDialog
        open={!!decide}
        onOpenChange={(open) => !open && setDecide(null)}
        title={decide?.decision === "approve" ? t("compliance.approveException") : t("compliance.rejectException")}
        description={t("compliance.decideDesc")}
        confirmLabel={decide?.decision === "approve" ? t("common.approve") : t("common.reject")}
        destructive={decide?.decision === "reject"}
        pending={decideMut.isPending}
        onConfirm={(note) => { if (decide) decideMut.mutate({ id: decide.id, decision: decide.decision, note }); }}
      />
    </Shell>
  );
}
