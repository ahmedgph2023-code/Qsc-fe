import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState, StatTile } from "@/components/phase1/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import {
  getCustomers, getAiHealth, listAiGovernance, runAiAssist, acceptAiLog,
  listCommentary, generateCommentary, reviewCommentary,
  runScenario, listScenarios, runFrontier,
  type CustomerData,
} from "@/lib/api";

export default function AiAssistantPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: health } = useQuery({ queryKey: ["ai-health"], queryFn: getAiHealth });
  const { data: logs } = useQuery({ queryKey: ["ai-governance"], queryFn: listAiGovernance });
  const logRows = logs?.data ?? [];
  const paging = useClientTablePage(logRows, String(logRows.length));
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const [portfolioId, setPortfolioId] = useState("");
  const [promptType, setPromptType] = useState("portfolio_summary");
  const [draft, setDraft] = useState("");
  const [logId, setLogId] = useState("");

  const customerOptions = useMemo(
    () => customers.filter((c: CustomerData) => c.portfolioId).map((c) => ({
      value: c.portfolioId,
      label: `${c.name} (${c.accountNumber || c.id.slice(0, 8)})`,
    })),
    [customers],
  );

  const promptTypes = useMemo(() => [
    { value: "portfolio_summary", label: t("phase4.promptPortfolioSummary") },
    { value: "risk_summary", label: t("phase4.promptRiskSummary") },
    { value: "compliance_summary", label: t("phase4.promptComplianceSummary") },
    { value: "commentary_draft", label: t("phase4.promptCommentaryDraft") },
    { value: "research_draft", label: t("phase4.promptResearchDraft") },
    { value: "rebalance_explain", label: t("phase4.promptRebalanceExplain") },
    { value: "ticker_ideas", label: t("phase4.promptTickerIdeas") },
  ], [t]);

  const assist = useMutation({
    mutationFn: () => runAiAssist({
      promptType,
      portfolioId: portfolioId || undefined,
    }),
    onSuccess: (out) => {
      setDraft(out.draft);
      setLogId(out.logId);
      qc.invalidateQueries({ queryKey: ["ai-governance"] });
    },
  });

  const accept = useMutation({
    mutationFn: (accepted: boolean) => acceptAiLog(logId, accepted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-governance"] }),
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase4.aiTitle")}
        description={t("phase4.aiDesc")}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label={t("phase4.mode")} value={t("phase4.analysisOnly")} hint={health?.disclosure} />
        <StatTile label={t("phase4.gemini")} value={health?.geminiConfigured ? t("phase4.configured") : t("phase4.templateFallback")} hint="" />
        <StatTile label={t("phase4.forbiddenTools")} value={String(health?.forbiddenActions?.length ?? 0)} hint={t("phase4.forbiddenHint")} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <form
          className="space-y-3 rounded-2xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            assist.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>{t("phase4.promptType")}</Label>
            <SelectField value={promptType} onValueChange={setPromptType} options={promptTypes} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("phase4.portfolioOptional")}</Label>
            <SelectField value={portfolioId} onValueChange={setPortfolioId} options={customerOptions} placeholder={t("common.optional")} />
          </div>
          <Button type="submit" disabled={assist.isPending}>{t("phase4.generateDraft")}</Button>
          {assist.isError && <p className="text-sm text-loss">{(assist.error as Error).message}</p>}
        </form>
        <div className="rounded-2xl border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("phase4.draftNotApproval")}</p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-sm">{draft || t("phase4.runPromptHint")}</pre>
          {logId && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => accept.mutate(true)}>{t("phase4.acceptDraft")}</Button>
              <Button size="sm" variant="outline" onClick={() => accept.mutate(false)}>{t("common.reject")}</Button>
            </div>
          )}
        </div>
      </div>
      <AppTable
        toolbar={<div className="border-b px-4 py-3 text-sm font-semibold">{t("phase4.governanceLog")}</div>}
        footer={<ClientTableFooter paging={paging} />}
      >
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase4.colType")}</TableHead>
              <TableHead>{t("phase4.colModel")}</TableHead>
              <TableHead>{t("phase4.colAccepted")}</TableHead>
              <TableHead>{t("phase4.colPreview")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.promptType}</TableCell>
                <TableCell>{l.model}</TableCell>
                <TableCell>{l.accepted == null ? "—" : l.accepted ? t("common.yes") : t("common.no")}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{l.outputRef}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function CommentaryPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["commentary"], queryFn: listCommentary });
  const commentaryRows = data?.data ?? [];
  const paging = useClientTablePage(commentaryRows, String(commentaryRows.length));
  const [kind, setKind] = useState("aum_monthly");
  const [periodLabel, setPeriodLabel] = useState(() => new Date().toISOString().slice(0, 7));
  const gen = useMutation({
    mutationFn: () => generateCommentary({ kind, periodLabel }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commentary"] }),
  });
  const review = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => reviewCommentary(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commentary"] }),
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase4.commentaryTitle")}
        description={t("phase4.commentaryDesc")}
      />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <SelectField
          value={kind}
          onValueChange={setKind}
          options={[
            { value: "client_monthly", label: t("phase4.kindClientMonthly") },
            { value: "aum_monthly", label: t("phase4.kindAumMonthly") },
            { value: "ic_quarterly", label: t("phase4.kindIcQuarterly") },
          ]}
        />
        <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} className="max-w-[10rem]" />
        <Button onClick={() => gen.mutate()} disabled={gen.isPending}>{t("phase4.generateAiDraft")}</Button>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase4.colKind")}</TableHead>
              <TableHead>{t("phase4.colPeriod")}</TableHead>
              <TableHead>{t("phase4.colStatus")}</TableHead>
              <TableHead>{t("phase4.colBody")}</TableHead>
              <TableHead className="text-end">{t("phase4.colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commentaryRows.length === 0 ? (
              <TableRow><TableCell colSpan={5}><EmptyState title={t("phase4.emptyDraftsTitle")} description={t("phase4.emptyDraftsDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.kind}</TableCell>
                <TableCell className="font-data">{d.periodLabel ?? "—"}</TableCell>
                <TableCell><Badge>{d.status}</Badge></TableCell>
                <TableCell className="max-w-sm truncate text-sm">{d.body}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  {(d.status === "draft" || d.status === "edited") && (
                    <>
                      <Button size="sm" onClick={() => review.mutate({ id: d.id, status: "accepted" })}>{t("phase4.accept")}</Button>
                      <Button size="sm" variant="outline" onClick={() => review.mutate({ id: d.id, status: "rejected" })}>{t("common.reject")}</Button>
                    </>
                  )}
                  {(d.status === "accepted" || d.status === "edited") && (
                    <Button size="sm" variant="secondary" onClick={() => review.mutate({ id: d.id, status: "released" })}>{t("phase4.markReleased")}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function ScenariosPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: history } = useQuery({ queryKey: ["scenarios"], queryFn: () => listScenarios() });
  const scenarioRows = history?.data ?? [];
  const paging = useClientTablePage(scenarioRows, String(scenarioRows.length));
  const [portfolioId, setPortfolioId] = useState("");
  const [kind, setKind] = useState("price_shock");
  const [shockPct, setShockPct] = useState("-10");
  const [resultJson, setResultJson] = useState("");

  const customerOptions = useMemo(
    () => customers.filter((c: CustomerData) => c.portfolioId).map((c) => ({
      value: c.portfolioId,
      label: `${c.name} (${c.accountNumber || c.id.slice(0, 8)})`,
    })),
    [customers],
  );

  const run = useMutation({
    mutationFn: () => runScenario({
      kind,
      portfolioId,
      shockPct: kind === "price_shock" ? Number(shockPct) : undefined,
    }),
    onSuccess: (out) => {
      setResultJson(JSON.stringify(out.result, null, 2));
      qc.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase4.scenariosTitle")}
        description={t("phase4.scenariosDesc")}
      />
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4">
        <div className="space-y-1">
          <Label>{t("common.portfolio")}</Label>
          <SelectField value={portfolioId} onValueChange={setPortfolioId} options={customerOptions} placeholder={t("common.client")} />
        </div>
        <div className="space-y-1">
          <Label>{t("phase4.colKind")}</Label>
          <SelectField
            value={kind}
            onValueChange={setKind}
            options={[
              { value: "price_shock", label: t("phase4.kindPriceShock") },
              { value: "cash_deploy", label: t("phase4.kindCashDeploy") },
              { value: "liquidity_stress", label: t("phase4.kindLiquidityStress") },
              { value: "benchmark_relative", label: t("phase4.kindBenchmarkRelative") },
              { value: "multi_trade", label: t("phase4.kindMultiTrade") },
            ]}
          />
        </div>
        {kind === "price_shock" && (
          <div className="space-y-1">
            <Label>{t("phase4.shockPct")}</Label>
            <Input value={shockPct} onChange={(e) => setShockPct(e.target.value)} className="w-24" />
          </div>
        )}
        <Button disabled={!portfolioId || run.isPending} onClick={() => run.mutate()}>{t("phase4.runScenario")}</Button>
        {run.isError && <p className="w-full text-sm text-loss">{(run.error as Error).message}</p>}
      </div>
      {resultJson && (
        <pre className="mb-4 max-h-80 overflow-auto rounded-2xl border bg-card p-4 text-xs">{resultJson}</pre>
      )}
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase4.colName")}</TableHead>
              <TableHead>{t("phase4.colKind")}</TableHead>
              <TableHead>{t("phase4.colPortfolio")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell><Badge variant="outline">{s.kind}</Badge></TableCell>
                <TableCell className="font-data text-xs">{s.portfolioId.slice(0, 8)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function FrontierPage() {
  const { t } = useTranslation();
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const [portfolioId, setPortfolioId] = useState("");
  const [out, setOut] = useState<Awaited<ReturnType<typeof runFrontier>> | null>(null);
  const proposed = out?.proposed ?? [];
  const paging = useClientTablePage(proposed, String(proposed.length));

  const customerOptions = useMemo(
    () => customers.filter((c: CustomerData) => c.portfolioId).map((c) => ({
      value: c.portfolioId,
      label: `${c.name} (${c.accountNumber || c.id.slice(0, 8)})`,
    })),
    [customers],
  );

  const run = useMutation({
    mutationFn: () => runFrontier({ portfolioId, maxNames: 12 }),
    onSuccess: setOut,
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase4.frontierTitle")}
        description={t("phase4.frontierDesc")}
      />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <SelectField value={portfolioId} onValueChange={setPortfolioId} options={customerOptions} placeholder={t("phase4.clientPortfolio")} />
        <Button disabled={!portfolioId || run.isPending} onClick={() => run.mutate()}>{t("phase4.runAdvisory")}</Button>
        {run.isError && <p className="w-full text-sm text-loss">{(run.error as Error).message}</p>}
      </div>
      {out && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="font-semibold">{out.confirmation ?? out.message ?? out.status}</p>
            <p className="mt-1 text-muted-foreground">{t("phase4.advisoryNote")}</p>
          </div>
          <AppTable footer={<ClientTableFooter paging={paging} />}>
            <TableHeader>
                <TableRow>
                  <TableHead>{t("common.ticker")}</TableHead>
                  <TableHead>{t("common.sector")}</TableHead>
                  <TableHead className="text-end">{t("phase4.colProposedWeight")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paging.paged.map((p) => (
                  <TableRow key={p.ticker}>
                    <TableCell>{p.ticker}</TableCell>
                    <TableCell>{p.sector}</TableCell>
                    <TableCell className="text-end font-data">{(p.weight * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </AppTable>
        </div>
      )}
    </Shell>
  );
}
