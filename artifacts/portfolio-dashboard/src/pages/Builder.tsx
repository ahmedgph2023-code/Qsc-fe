import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { StatusStepper } from "@/components/phase1/StatusStepper";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { SelectField } from "@/components/phase1/SelectField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import {
  convertBuilderSession, createBuilderSession, getBuilderModels, getIndexReference,
  getMandate, getPortfolioManager, getStocks, proposeBuilderTrades, reviewBuilderSession,
  saveModelHoldings, updateBuilderSession,
} from "@/lib/api";
import { benchmarkNameFor, modelCodeFor, shariahGroupLabel, normalizePreference, type RiskProfile } from "@/lib/mandatePreview";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { PrintButton } from "@/components/phase1/PrintButton";

type DraftHolding = { stockId: string; weight: number; sleeve: string };
const STAGE_IDS = ["Setup", "Index", "Build", "Review", "Trades", "Save"] as const;

export default function Builder() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<string>("Setup");
  const [targetType, setTargetType] = useState<"client" | "model">("client");
  const [portfolioId, setPortfolioId] = useState("");
  const [modelId, setModelId] = useState("");
  const [indexName, setIndexName] = useState<"QERI" | "DSM">("QERI");
  const [trigger, setTrigger] = useState("ad_hoc");
  const [sessionId, setSessionId] = useState("");
  const [holdings, setHoldings] = useState<DraftHolding[]>([]);
  const [review, setReview] = useState<any>();
  const [trades, setTrades] = useState<any[]>([]);
  const [converted, setConverted] = useState<any>();
  const [savedModel, setSavedModel] = useState(false);
  const [error, setError] = useState("");
  const { role, username } = useAuth();
  const canMutate = canPerformAction("builder.mutate", { role, username });
  const canConvert = canPerformAction("builder.convert", { role, username });

  const stageLabel = (id: string) => t(`builder.stages.${id}`, { defaultValue: id });
  const stages = STAGE_IDS.map((id) => stageLabel(id));

  const { data: portfolios = [] } = useQuery({ queryKey: ["portfolio-manager"], queryFn: () => getPortfolioManager() });
  const { data: models = [] } = useQuery({ queryKey: ["builder-models"], queryFn: getBuilderModels });
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const { data: reference } = useQuery({ queryKey: ["index-reference", indexName], queryFn: () => getIndexReference(indexName) });
  const constituents = reference?.constituents ?? [];
  const constPaging = useClientTablePage(constituents, `${indexName}|${constituents.length}`);
  const holdPaging = useClientTablePage(holdings, String(holdings.length));
  const tradePaging = useClientTablePage(trades, String(trades.length));
  const selectedPortfolio = portfolios.find((p) => p.portfolioId === portfolioId);
  const { data: mandate } = useQuery({
    queryKey: ["mandate", selectedPortfolio?.customerId],
    queryFn: () => getMandate(selectedPortfolio!.customerId),
    enabled: !!selectedPortfolio?.customerId,
    retry: false,
  });

  const totalWeight = useMemo(() => holdings.reduce((sum, row) => sum + Number(row.weight || 0), 0), [holdings]);
  const coreWeight = useMemo(() => holdings.filter((h) => h.sleeve === "core").reduce((s, h) => s + Number(h.weight || 0), 0), [holdings]);
  const satelliteWeight = useMemo(() => holdings.filter((h) => h.sleeve === "satellite").reduce((s, h) => s + Number(h.weight || 0), 0), [holdings]);

  const createMut = useMutation({
    mutationFn: () => createBuilderSession({
      targetType,
      portfolioId: targetType === "client" ? portfolioId : null,
      modelPortfolioId: modelId || null,
      mandateId: mandate?.id || null,
      payload: { holdings: [] },
    }),
    onSuccess: (data) => { setSessionId(data.id); setError(""); setTab("Index"); },
    onError: (e: Error) => setError(e.message),
  });
  const saveMut = useMutation({
    mutationFn: () => updateBuilderSession(sessionId, { payload: { holdings } }),
    onSuccess: () => { setReview(undefined); setTab("Review"); },
    onError: (e: Error) => setError(e.message),
  });
  const reviewMut = useMutation({
    mutationFn: () => reviewBuilderSession(sessionId),
    onSuccess: (data) => setReview(data),
    onError: (e: Error) => setError(e.message),
  });
  const tradesMut = useMutation({
    mutationFn: () => proposeBuilderTrades(sessionId),
    onSuccess: (data) => { setTrades(data.trades || []); setTab("Trades"); },
    onError: (e: Error) => setError(e.message),
  });
  const convertMut = useMutation({
    mutationFn: () => convertBuilderSession(sessionId, { trigger }),
    onSuccess: (data) => { setConverted(data); setTab("Save"); },
    onError: (e: Error) => setError(e.message),
  });
  const modelSaveMut = useMutation({
    mutationFn: () => saveModelHoldings(modelId, holdings.map((h) => ({
      stockId: h.stockId,
      targetWeight: h.weight / 100,
      sleeve: h.sleeve,
    }))),
    onSuccess: () => setSavedModel(true),
    onError: (e: Error) => setError(e.message),
  });

  const addHolding = () => {
    const stock = stocks.find((s) => !holdings.some((h) => h.stockId === s.id));
    if (stock) setHoldings([...holdings, { stockId: stock.id, weight: 0, sleeve: "active" }]);
  };
  const loadIndex = () => setHoldings((reference?.constituents || []).map((c: any) => ({
    stockId: c.stockId,
    weight: Number(c.weight) > 1 ? Number(c.weight) : Number(c.weight) * 100,
    sleeve: "core",
  })));
  const applyCore65 = () => {
    const core = holdings.filter((h) => h.sleeve === "core");
    if (!core.length) return;
    const each = 65 / core.length;
    setHoldings(holdings.map((h) => h.sleeve === "core" ? { ...h, weight: Number(each.toFixed(2)) } : h));
  };
  const equalWeightSatellite = () => {
    const sat = holdings.filter((h) => h.sleeve === "satellite");
    if (!sat.length) return;
    const remaining = Math.max(0, 100 - coreWeight);
    const each = remaining / sat.length;
    setHoldings(holdings.map((h) => h.sleeve === "satellite" ? { ...h, weight: Number(each.toFixed(2)) } : h));
  };
  const markAllActive = () => setHoldings(holdings.map((h) => ({ ...h, sleeve: "active" })));
  const loadModelHoldings = () => {
    const model = models.find((m: any) => m.id === modelId);
    if (!model?.holdings?.length) return;
    setHoldings(model.holdings.map((h: any) => ({
      stockId: h.stockId,
      weight: Number(h.targetWeight) > 1 ? Number(h.targetWeight) : Number(h.targetWeight) * 100,
      sleeve: h.sleeve || "active",
    })));
  };

  const pref = normalizePreference(mandate?.shariahPreference || selectedPortfolio?.shariahPreference || "fully_shariah");
  const risk = (mandate?.riskProfile || selectedPortfolio?.riskProfile || "medium") as RiskProfile;

  return (
    <Shell>
      <PageHeader
        title={t("builder.title")}
        description={t("builder.description")}
        meta={
          <>
            {sessionId && <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">{t("builder.sessionLive")}</span>}
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("common.stageMeta", { tab: stageLabel(tab) })}</span>
          </>
        }
        actions={
          <PrintButton
            title={t("builder.printTitle")}
            label={t("common.print")}
            buildHtml={() => {
              const rows = holdings.map((h) => {
                const s = stocks.find((x) => x.id === h.stockId);
                return `<tr><td>${s?.ticker || h.stockId}</td><td>${h.sleeve}</td><td class="num">${Number(h.weight).toFixed(2)}%</td></tr>`;
              }).join("");
              const tradeRows = trades.map((trade: any) =>
                `<tr><td>${trade.side || ""}</td><td>${trade.ticker || trade.stockId || ""}</td><td class="num">${trade.quantity ?? ""}</td><td class="num">${trade.estimatedPrice ?? ""}</td></tr>`
              ).join("");
              return `<h1>${t("builder.printHeading")}</h1>
<p class="meta">Session ${sessionId || t("common.na")} · ${targetType} · Index ${indexName} · ${new Date().toLocaleString()}</p>
<p class="meta">Mandate ${pref} / ${risk} · Core ${coreWeight.toFixed(1)}% · Satellite ${satelliteWeight.toFixed(1)}%</p>
<h2>${t("builder.printHoldings")}</h2>
<table><thead><tr><th>${t("common.ticker")}</th><th>${t("common.sleeve")}</th><th>${t("common.weight")}</th></tr></thead><tbody>${rows || `<tr><td colspan=3>${t("builder.printNoHoldings")}</td></tr>`}</tbody></table>
<h2>${t("builder.printTrades")}</h2>
<table><thead><tr><th>${t("common.side")}</th><th>${t("common.stock")}</th><th>${t("common.qty")}</th><th>${t("common.price")}</th></tr></thead><tbody>${tradeRows || `<tr><td colspan=4>${t("builder.printNoTrades")}</td></tr>`}</tbody></table>
${converted?.id ? `<p class="muted">${t("builder.printConverted", { code: converted.rebalanceCode || converted.id })}</p>` : ""}`;
            }}
          />
        }
      />
      {error && <p className="error-banner">{error}</p>}

      <StatsSummaryBar
        className="mb-6"
        ariaLabel={t("builder.holdings")}
        items={[
          {
            id: "holdings",
            icon: "/layers.png",
            label: t("builder.holdings"),
            value: <AnimatedNumber value={holdings.length} format="integer" />,
            hint: "",
          },
          {
            id: "weight",
            icon: "/analytics.png",
            label: t("builder.totalWeight"),
            value: <AnimatedNumber value={totalWeight} format="percent" digits={1} />,
            hint: "100%",
            valueClassName: Math.abs(totalWeight - 100) < 0.01 ? "text-[var(--color-positive)]" : "text-[var(--color-warning)]",
          },
          {
            id: "core",
            icon: "/bank.png",
            label: t("builder.core"),
            value: <AnimatedNumber value={coreWeight} format="percent" digits={1} />,
            hint: "",
          },
          {
            id: "satellite",
            icon: "/chart.png",
            label: t("builder.satellite"),
            value: <AnimatedNumber value={satelliteWeight} format="percent" digits={1} />,
            hint: "",
          },
        ]}
      />

      <div className="panel mb-6 border-gold/20"><StatusStepper steps={stages} current={stageLabel(tab)} /></div>

      <Tabs value={tab} onValueChange={setTab} className="cdp-data">
        <CdpTabsList value={tab} className="mb-5">
          {STAGE_IDS.map((stage) => (
            <TabsTrigger key={stage} value={stage} className={CDP_TAB} disabled={stage !== "Setup" && !sessionId}>{stageLabel(stage)}</TabsTrigger>
          ))}
        </CdpTabsList>

        <TabsContent value="Setup">
          <Card>
            <CardHeader><CardTitle>{t("builder.constructionMandate")}</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("builder.targetMode")}</Label>
                <SelectField
                  className="w-full"
                  value={targetType}
                  onValueChange={(v) => setTargetType(v as "client" | "model")}
                  options={[
                    { value: "client", label: t("builder.clientPortfolio") },
                    { value: "model", label: t("builder.modelPortfolio") },
                  ]}
                />
              </div>
              {targetType === "client" ? (
                <div className="space-y-2">
                  <Label>{t("builder.clientPortfolio")}</Label>
                  <SelectField
                    className="w-full"
                    value={portfolioId}
                    onValueChange={setPortfolioId}
                    placeholder={t("common.selectAccount")}
                    options={[{ value: "", label: t("common.selectAccount") }, ...portfolios.map((p) => ({ value: p.portfolioId, label: `${p.customerName} · ${p.accountNumber || p.portfolioId.slice(0, 8)}` }))]}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("builder.modelPortfolio")}</Label>
                  <SelectField
                    className="w-full"
                    value={modelId}
                    onValueChange={setModelId}
                    placeholder={t("common.selectModel")}
                    options={[{ value: "", label: t("common.selectModel") }, ...models.map((m: any) => ({ value: m.id, label: `${m.code} · ${m.name}` }))]}
                  />
                </div>
              )}
              {targetType === "client" && (
                <div className="space-y-2">
                  <Label>{t("builder.modelOverlay")}</Label>
                  <SelectField
                    className="w-full"
                    value={modelId}
                    onValueChange={setModelId}
                    options={[{ value: "", label: t("builder.noModel") }, ...models.map((m: any) => ({ value: m.id, label: `${m.code} · ${m.name}` }))]}
                  />
                </div>
              )}
              {(selectedPortfolio || mandate) && (
                <div className="md:col-span-2 rounded-md border border-gold/20 bg-gold/5 p-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-gold">{t("builder.mandateConstraints")}</p>
                  <div className="flex flex-wrap gap-2">
                    <MandateBadge value={mandate?.approvalStatus || selectedPortfolio?.mandateStatus || "missing"} />
                    <MandateBadge value={pref} />
                    <span className="rounded border px-2 py-1 font-mono text-xs">{benchmarkNameFor(pref)}</span>
                    <span className="rounded border px-2 py-1 font-mono text-xs">{modelCodeFor(pref, risk)}</span>
                    <span className="rounded border px-2 py-1 font-mono text-xs capitalize">{t("builder.riskLabel", { risk })}</span>
                  </div>
                  {mandate?.approvalStatus && mandate.approvalStatus !== "approved" && (
                    <p className="mt-2 text-sm text-amber-300">{t("builder.mandateNotApproved")}</p>
                  )}
                </div>
              )}
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button
                  disabled={!canMutate || (targetType === "client" ? !portfolioId : !modelId) || createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("builder.openSession")}
                </Button>
                {modelId && <Button variant="outline" onClick={loadModelHoldings}>{t("builder.loadModelWeights")}</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Index">
          <Card>
            <CardHeader><CardTitle>{t("builder.indexReference")}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label>{t("builder.referenceIndex")}</Label>
                  <SelectField
                    className="control"
                    value={indexName}
                    onValueChange={(v) => setIndexName(v as "QERI" | "DSM")}
                    options={[
                      { value: "QERI", label: "QERI" },
                      { value: "DSM", label: "DSM" },
                    ]}
                  />
                </div>
                <Button variant="outline" onClick={loadIndex}>{t("builder.useConstituentWeights")}</Button>
                <Button onClick={() => setTab("Build")}>{t("builder.continue")}</Button>
              </div>
              <p className="mb-3 font-mono text-xs text-muted-foreground">
                {t("builder.constituentsMeta", {
                  count: reference?.constituents?.length || 0,
                  date: reference?.effectiveDate || t("builder.notLoaded"),
                })}
              </p>
              <AppTable footer={<ClientTableFooter paging={constPaging} />}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.ticker")}</TableHead>
                      <TableHead>{t("common.company")}</TableHead>
                      <TableHead>{t("common.sector")}</TableHead>
                      <TableHead>{t("common.shariah")}</TableHead>
                      <TableHead className="text-end">{t("common.price")}</TableHead>
                      <TableHead className="text-end">{t("common.weight")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {constituents.length ? constPaging.paged.map((c: any) => (
                      <TableRow key={`${c.stockId}-${c.effectiveDate}`}>
                        <TableCell className="font-mono">{c.ticker}</TableCell>
                        <TableCell>{c.companyName}</TableCell>
                        <TableCell>{c.sector}</TableCell>
                        <TableCell className="font-mono">{shariahGroupLabel(c.shariahGroup)}</TableCell>
                        <TableCell className="text-end font-data">{c.price != null ? Number(c.price).toFixed(2) : t("common.na")}</TableCell>
                        <TableCell className="text-end font-data">
                          {(Number(c.weight) > 1 ? Number(c.weight) : Number(c.weight) * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t("builder.noConstituents")}</TableCell></TableRow>
                    )}
                  </TableBody>
              </AppTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Build">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>{t("builder.targetAllocation")}</CardTitle>
              <div className="flex flex-wrap gap-3 font-data text-sm">
                <span className={Math.abs(totalWeight - 100) < 0.01 ? "text-emerald-400" : "text-amber-300"}>{t("builder.totalPct", { pct: totalWeight.toFixed(2) })}</span>
                <span className="text-muted-foreground">{t("builder.corePct", { pct: coreWeight.toFixed(1) })}</span>
                <span className="text-muted-foreground">{t("builder.satellitePct", { pct: satelliteWeight.toFixed(1) })}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={applyCore65}>{t("builder.applyCore65")}</Button>
                <Button size="sm" variant="outline" onClick={equalWeightSatellite}>{t("builder.equalWeightSatellite")}</Button>
                <Button size="sm" variant="outline" onClick={markAllActive}>{t("builder.fullActive")}</Button>
              </div>
              <AppTable footer={<ClientTableFooter paging={holdPaging} />}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.security")}</TableHead>
                      <TableHead>{t("common.sleeve")}</TableHead>
                      <TableHead className="text-end">{t("builder.weightPct")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdPaging.paged.map((row, localI) => {
                      const i = holdPaging.start + localI;
                      return (
                      <TableRow key={`${row.stockId}-${i}`}>
                        <TableCell>
                          <SelectField
                            className="h-9 w-full"
                            value={row.stockId}
                            onValueChange={(v) => setHoldings(holdings.map((h, n) => n === i ? { ...h, stockId: v } : h))}
                            options={stocks.map((s) => ({ value: s.id, label: `${s.ticker} · ${s.companyName}` }))}
                          />
                        </TableCell>
                        <TableCell>
                          <SelectField
                            className="h-9"
                            value={row.sleeve}
                            onValueChange={(v) => setHoldings(holdings.map((h, n) => n === i ? { ...h, sleeve: v } : h))}
                            options={[
                              { value: "core", label: t("common.core") },
                              { value: "satellite", label: t("common.satellite") },
                              { value: "active", label: t("common.active") },
                            ]}
                          />
                        </TableCell>
                        <TableCell className="w-36">
                          <Input className="text-end font-data" type="number" value={row.weight} onChange={(e) => setHoldings(holdings.map((h, n) => n === i ? { ...h, weight: Number(e.target.value) } : h))} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setHoldings(holdings.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
              </AppTable>
              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={addHolding}><Plus className="me-2 h-4 w-4" />{t("builder.addSecurity")}</Button>
                <Button disabled={!canMutate || !holdings.length || saveMut.isPending} onClick={() => saveMut.mutate()}>{t("builder.saveReview")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Review">
          <Card>
            <CardHeader><CardTitle>{t("builder.validationCompliance")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!review ? (
                <Button disabled={!canMutate || reviewMut.isPending} onClick={() => reviewMut.mutate()}>{t("builder.runReview")}</Button>
              ) : (
                <div className="space-y-2">
                  {review.validations?.map((v: any) => (
                    <div key={v.code} className={`rounded border p-3 ${v.ok ? "border-emerald-500/20 bg-emerald-500/5" : "severity-critical"}`}>
                      <p className="font-mono text-xs">{v.code} · {v.message}</p>
                    </div>
                  ))}
                  <p className={`font-mono text-sm ${review.compliance?.passed ? "text-emerald-400" : "text-rose-400"}`}>
                    {review.compliance?.passed ? t("builder.compliancePassed") : t("builder.complianceFailed")}
                  </p>
                </div>
              )}
              <Button disabled={!canMutate || !review || !review.compliance?.passed || tradesMut.isPending} onClick={() => tradesMut.mutate()}>
                {t("builder.proposeTrades")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Trades">
          <Card>
            <CardHeader><CardTitle>{t("builder.proposedOrders")}</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 max-w-xs space-y-2">
                <Label>{t("builder.rebalanceTrigger")}</Label>
                <SelectField
                  className="w-full"
                  value={trigger}
                  onValueChange={setTrigger}
                  options={[
                    { value: "ad_hoc", label: t("common.triggers.ad_hoc") },
                    { value: "threshold", label: t("builder.thresholdBreach") },
                    { value: "scheduled", label: t("common.triggers.scheduled") },
                    { value: "mandate_change", label: t("common.triggers.mandate_change") },
                    { value: "cash_flow", label: t("common.triggers.cash_flow") },
                  ]}
                />
              </div>
              <AppTable className="mb-4" footer={<ClientTableFooter paging={tradePaging} />}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.side")}</TableHead>
                      <TableHead>{t("common.security")}</TableHead>
                      <TableHead className="text-end">{t("common.quantity")}</TableHead>
                      <TableHead className="text-end">{t("builder.estimatedValue")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.length ? tradePaging.paged.map((trade, i) => (
                      <TableRow key={`${trade.stockId}-${tradePaging.start + i}`}>
                        <TableCell className={trade.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>{trade.side}</TableCell>
                        <TableCell className="font-mono">{trade.ticker || trade.stockId}</TableCell>
                        <TableCell className="text-end font-data">{Number(trade.quantity).toLocaleString()}</TableCell>
                        <TableCell className="text-end font-data">{Number(trade.estimatedValue).toLocaleString("en-QA", { style: "currency", currency: "QAR" })}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">{t("builder.noTradesRequired")}</TableCell></TableRow>
                    )}
                  </TableBody>
              </AppTable>
              {converted ? (
                <p className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" />{t("builder.createdRebalance", { code: converted.rebalanceCode })}</p>
              ) : (
                <Button disabled={!canConvert || convertMut.isPending || targetType !== "client"} onClick={() => convertMut.mutate()}>
                  {t("builder.convertToRebalance")}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="Save">
          <Card>
            <CardHeader><CardTitle>{t("builder.persistOutcomes")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {converted && (
                <p className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> {t("builder.rebalanceReady", { code: converted.rebalanceCode })}
                </p>
              )}
              {modelId ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("builder.saveModelHint")}</p>
                  <Button disabled={!canMutate || modelSaveMut.isPending || !holdings.length} onClick={() => modelSaveMut.mutate()}>
                    <Save className="me-2 h-4 w-4" />{t("builder.saveModelVersion")}
                  </Button>
                  {savedModel && <p className="text-sm text-emerald-400">{t("builder.modelUpdated")}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("builder.selectModelOverlay")}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
