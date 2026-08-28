import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { StatusStepper } from "@/components/phase1/StatusStepper";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { ReasonDialog } from "@/components/phase1/ReasonDialog";
import { useAuth } from "@/lib/AuthContext";
import { createRebalanceCorrection, getRebalance, getStocks, transitionRebalance } from "@/lib/api";
import { canPerformAction } from "@/lib/access";
import { PrintButton } from "@/components/phase1/PrintButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";

const qar = new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" });

function SnapshotTable({ title, snapshot, stocks }: { title: string; snapshot: any; stocks: any[] }) {
  const { t } = useTranslation();
  const holdings = snapshot?.holdings || snapshot?.positions || [];
  const paging = useClientTablePage(holdings, String(holdings.length));
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <AppTable footer={<ClientTableFooter paging={paging} />}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.security")}</TableHead>
              <TableHead className="text-end">{t("rebalanceDetail.qtyWeight")}</TableHead>
              <TableHead className="text-end">{t("common.value")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!holdings.length ? (
              <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{t("rebalanceDetail.noSnapshot")}</TableCell></TableRow>
            ) : paging.paged.map((h: any, i: number) => {
              const stock = stocks.find((s) => s.id === (h.stockId || h.id));
              return (
                <TableRow key={`${h.stockId || h.id || i}-${paging.start + i}`}>
                  <TableCell className="font-mono">{stock?.ticker || h.ticker || h.stockId || t("common.na")}</TableCell>
                  <TableCell className="text-end font-data">
                    {h.quantity != null ? Number(h.quantity).toLocaleString() : h.weight != null ? `${(Number(h.weight) > 1 ? Number(h.weight) : Number(h.weight) * 100).toFixed(2)}%` : t("common.na")}
                  </TableCell>
                  <TableCell className="text-end font-data">{h.value != null || h.currentValue != null ? qar.format(Number(h.value ?? h.currentValue)) : t("common.na")}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </AppTable>
      </CardContent>
    </Card>
  );
}

export default function RebalanceDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { role, username } = useAuth();
  const client = useQueryClient();
  const [pendingAction, setPendingAction] = useState<"approve" | "execute" | "finalize" | "cancel" | null>(null);
  const [correctionNote, setCorrectionNote] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("trades");

  const { data, isLoading } = useQuery({ queryKey: ["rebalance", id], queryFn: () => getRebalance(id!), enabled: !!id });
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const proposedTrades = data?.proposedTrades ?? [];
  const targetHoldings = data?.targetAllocation?.holdings || [];
  const tradePaging = useClientTablePage(proposedTrades, String(proposedTrades.length));
  const targetPaging = useClientTablePage(targetHoldings, String(targetHoldings.length));

  const actionMut = useMutation({
    mutationFn: ({ action, reason }: { action: "approve" | "execute" | "finalize" | "cancel"; reason: string }) =>
      transitionRebalance(id!, action, reason),
    onSuccess: () => {
      setPendingAction(null);
      setError("");
      client.invalidateQueries({ queryKey: ["rebalance", id] });
      client.invalidateQueries({ queryKey: ["rebalances"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  const correctionMut = useMutation({
    mutationFn: () => createRebalanceCorrection(id!, {
      fieldPath: "notes",
      oldValue: null,
      newValue: { notes: correctionNote },
      reason: correctionNote,
    }),
    onSuccess: () => {
      setCorrectionNote("");
      client.invalidateQueries({ queryKey: ["rebalance", id] });
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading || !data) {
    return <Shell><p className="py-20 text-center font-mono text-muted-foreground">{t("rebalanceDetail.loading")}</p></Shell>;
  }

  const canApprove = canPerformAction("rebalance.approve", { role, username }) && data.lockStatus === "draft";
  const canExecute = canPerformAction("rebalance.execute", { role, username }) && data.lockStatus === "approved";
  const canFinalize = (canPerformAction("rebalance.approve", { role, username }) || canPerformAction("rebalance.execute", { role, username }))
    && ["approved", "executed"].includes(data.lockStatus);
  const canCancel = data.lockStatus === "draft" && canPerformAction("rebalance.approve", { role, username });
  const canCorrect = data.lockStatus === "final" && canPerformAction("rebalance.approve", { role, username });

  const triggerDisplay = (() => {
    const key = String(data.trigger);
    const translated = t(`common.triggers.${key}`);
    return translated.startsWith("common.triggers.") ? key.replaceAll("_", " ") : translated;
  })();

  const timeline = [
    { label: t("rebalanceDetail.timelineProposed"), at: data.proposedAt },
    { label: t("rebalanceDetail.timelineApproved"), at: data.approvedAt },
    { label: t("rebalanceDetail.timelineExecuted"), at: data.executedAt },
    { label: t("rebalanceDetail.timelineFinalized"), at: data.finalizedAt },
  ].filter((item) => item.at);

  const dialogTitle =
    pendingAction === "approve" ? t("rebalanceDetail.approveTitle")
      : pendingAction === "execute" ? t("rebalanceDetail.executeTitle")
        : pendingAction === "finalize" ? t("rebalanceDetail.finalizeTitle")
          : t("rebalanceDetail.cancelTitle");

  const confirmLabel =
    pendingAction === "approve" ? t("rebalanceDetail.approve")
      : pendingAction === "execute" ? t("rebalanceDetail.executeTrades")
        : pendingAction === "finalize" ? t("rebalanceDetail.finalLock")
          : pendingAction === "cancel" ? t("common.cancel")
            : t("common.confirm");

  return (
    <Shell>
      <Link href="/rebalances" className="soft-link mb-4">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {t("rebalanceDetail.register")}
      </Link>
      <PageHeader
        title={data.rebalanceCode}
        description={t("rebalanceDetail.description", {
          when: new Date(data.proposedAt).toLocaleString(),
          trigger: triggerDisplay,
        })}
        meta={<MandateBadge value={data.lockStatus} />}
        actions={
          <>
            <PrintButton
              title={t("rebalanceDetail.printTitle", { code: data.rebalanceCode })}
              buildHtml={() => {
                const tradeRows = (data.proposedTrades || []).map((trade: any) => {
                  const s = stocks.find((x: any) => x.id === trade.stockId);
                  return `<tr><td>${trade.side}</td><td>${s?.ticker || trade.stockId}</td><td class="num">${trade.quantity}</td><td class="num">${trade.estimatedPrice ?? ""}</td></tr>`;
                }).join("");
                const target = ((data.targetAllocation as any)?.holdings || []).map((h: any) => {
                  const s = stocks.find((x: any) => x.id === h.stockId);
                  const w = Number(h.weight);
                  return `<tr><td>${s?.ticker || h.stockId}</td><td class="num">${(w > 1 ? w : w * 100).toFixed(2)}%</td></tr>`;
                }).join("");
                const none = t("rebalanceDetail.none");
                return `<h1>${t("rebalanceDetail.printTitle", { code: data.rebalanceCode })}</h1>
<p class="meta">${t("rebalanceDetail.printMeta", { status: data.lockStatus, trigger: data.trigger, when: new Date(data.proposedAt).toLocaleString() })}</p>
<h2>${t("rebalanceDetail.proposedTrades")}</h2>
<table><thead><tr><th>${t("common.side")}</th><th>${t("common.ticker")}</th><th>${t("common.qty")}</th><th>${t("common.price")}</th></tr></thead><tbody>${tradeRows || `<tr><td colspan=4>${none}</td></tr>`}</tbody></table>
<h2>${t("rebalanceDetail.targetAllocation")}</h2>
<table><thead><tr><th>${t("common.ticker")}</th><th>${t("common.weight")}</th></tr></thead><tbody>${target || `<tr><td colspan=2>${none}</td></tr>`}</tbody></table>`;
              }}
            />
            {canApprove && <Button onClick={() => setPendingAction("approve")}>{t("rebalanceDetail.approve")}</Button>}
            {canExecute && <Button onClick={() => setPendingAction("execute")}>{t("rebalanceDetail.executeTrades")}</Button>}
            {canFinalize && <Button onClick={() => setPendingAction("finalize")}>{t("rebalanceDetail.finalLock")}</Button>}
            {canCancel && <Button variant="destructive" onClick={() => setPendingAction("cancel")}>{t("common.cancel")}</Button>}
            {actionMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          </>
        }
      />
      {error && <p className="error-banner">{error}</p>}

      <div className="panel mb-6 border-gold/20"><StatusStepper steps={["draft", "approved", "executed", "final"]} current={data.lockStatus} /></div>

      {timeline.length > 0 && (
        <StatsSummaryBar
          className="mb-6"
          ariaLabel={t("rebalances.title")}
          items={timeline.map((item) => ({
            id: item.label,
            icon: "/calendar.png",
            label: item.label,
            value: new Date(item.at).toLocaleString(),
            hint: "",
          }))}
        />
      )}

      <Tabs value={tab} onValueChange={setTab} className="cdp-data">
        <CdpTabsList value={tab} className="mb-4">
          <TabsTrigger value="trades" className={CDP_TAB}>{t("rebalanceDetail.tabTrades")}</TabsTrigger>
          <TabsTrigger value="compare" className={CDP_TAB}>{t("rebalanceDetail.tabCompare")}</TabsTrigger>
          <TabsTrigger value="target" className={CDP_TAB}>{t("rebalanceDetail.tabTarget")}</TabsTrigger>
          <TabsTrigger value="corrections" className={CDP_TAB}>{t("rebalanceDetail.tabCorrections")}</TabsTrigger>
        </CdpTabsList>

        <TabsContent value="trades">
          <AppTable footer={<ClientTableFooter paging={tradePaging} />}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.side")}</TableHead>
                    <TableHead>{t("common.security")}</TableHead>
                    <TableHead className="text-end">{t("common.quantity")}</TableHead>
                    <TableHead className="text-end">{t("common.price")}</TableHead>
                    <TableHead className="text-end">{t("common.value")}</TableHead>
                    <TableHead>{t("common.compliance")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposedTrades.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">{t("rebalanceDetail.noProposedTrades")}</TableCell></TableRow>
                  ) : tradePaging.paged.map((trade: any) => {
                    const stock = stocks.find((s) => s.id === trade.stockId);
                    return (
                      <TableRow key={trade.id}>
                        <TableCell className={trade.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>{trade.side}</TableCell>
                        <TableCell className="font-mono">{stock?.ticker || trade.stockId}</TableCell>
                        <TableCell className="text-end font-data">{Number(trade.quantity).toLocaleString()}</TableCell>
                        <TableCell className="text-end font-data">{qar.format(Number(trade.estimatedPrice))}</TableCell>
                        <TableCell className="text-end font-data">{qar.format(Number(trade.estimatedValue))}</TableCell>
                        <TableCell className="uppercase text-emerald-400">{trade.complianceResult}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
          </AppTable>
        </TabsContent>

        <TabsContent value="compare">
          <div className="grid gap-4 lg:grid-cols-2">
            <SnapshotTable title={t("rebalanceDetail.beforeSnapshot")} snapshot={data.beforeSnapshot} stocks={stocks} />
            <SnapshotTable title={t("rebalanceDetail.afterSnapshot")} snapshot={data.afterSnapshot} stocks={stocks} />
          </div>
        </TabsContent>

        <TabsContent value="target">
          <AppTable footer={<ClientTableFooter paging={targetPaging} />}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.security")}</TableHead>
                    <TableHead>{t("common.sleeve")}</TableHead>
                    <TableHead className="text-end">{t("common.weight")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!targetHoldings.length ? (
                    <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">{t("rebalanceDetail.noTarget")}</TableCell></TableRow>
                  ) : targetPaging.paged.map((h: any, i: number) => {
                    const stock = stocks.find((s) => s.id === h.stockId);
                    return (
                      <TableRow key={`${h.stockId}-${targetPaging.start + i}`}>
                        <TableCell className="font-mono">{stock?.ticker || h.stockId}</TableCell>
                        <TableCell className="capitalize">{h.sleeve || t("common.na")}</TableCell>
                        <TableCell className="text-end font-data">
                          {(Number(h.weight) > 1 ? Number(h.weight) : Number(h.weight) * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
          </AppTable>
        </TabsContent>

        <TabsContent value="corrections">
          <Card>
            <CardHeader><CardTitle>{t("rebalanceDetail.postFinalCorrections")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(data.corrections || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("rebalanceDetail.noCorrections")}</p>
              ) : (
                <div className="space-y-2">
                  {data.corrections.map((c: any) => (
                    <div key={c.id} className="rounded border border-border/60 p-3 text-sm">
                      <p>{c.notes || c.reason || t("rebalanceDetail.correction")}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</p>
                    </div>
                  ))}
                </div>
              )}
              {canCorrect && (
                <div className="max-w-lg space-y-2">
                  <Label>{t("rebalanceDetail.correctionNote")}</Label>
                  <Input value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} placeholder={t("rebalanceDetail.correctionPlaceholder")} />
                  <Button disabled={!correctionNote.trim() || correctionMut.isPending} onClick={() => correctionMut.mutate()}>
                    {t("rebalanceDetail.fileCorrection")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReasonDialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={dialogTitle}
        description={t("common.reasonRequired")}
        confirmLabel={confirmLabel}
        destructive={pendingAction === "cancel"}
        pending={actionMut.isPending}
        onConfirm={(reason) => { if (pendingAction) actionMut.mutate({ action: pendingAction, reason }); }}
      />
    </Shell>
  );
}
