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
  getCustomers, getStocks, simulateTrade, listOrders, createOrder, transitionOrder, recordFill,
  type CustomerData, type StockData,
} from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";

export default function TradeSimulator() {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canSim = canPerformAction("sim.run", { role, username });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const [portfolioId, setPortfolioId] = useState("");
  const [stockId, setStockId] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("100");
  const [price, setPrice] = useState("");

  const customerOptions = useMemo(
    () => customers.filter((c: CustomerData) => c.portfolioId).map((c) => ({
      value: c.portfolioId,
      label: `${c.name} (${c.accountNumber || c.id.slice(0, 8)})`,
    })),
    [customers],
  );
  const stockOptions = useMemo(
    () => (stocks as StockData[]).map((s) => ({ value: s.id, label: `${s.ticker} · ${s.companyName}` })),
    [stocks],
  );

  const sim = useMutation({
    mutationFn: () => simulateTrade({
      portfolioId,
      legs: [{
        stockId,
        side,
        quantity: Number(quantity),
        price: price ? Number(price) : undefined,
      }],
    }),
  });

  const result = sim.data;
  const impact = result?.weightImpact ?? [];
  const impactPaging = useClientTablePage(impact, String(impact.length));

  return (
    <Shell>
      <PageHeader
        title={t("tradeSimulator.title")}
        description={t("tradeSimulator.description")}
      />
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <form
          className="space-y-3 rounded-2xl border bg-card p-4"
          onSubmit={(e) => {
            e.preventDefault();
            sim.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>{t("tradeSimulator.clientPortfolio")}</Label>
            <SelectField value={portfolioId} onValueChange={setPortfolioId} options={customerOptions} placeholder={t("common.selectClient")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.stock")}</Label>
            <SelectField value={stockId} onValueChange={setStockId} options={stockOptions} placeholder={t("common.selectStock")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>{t("common.side")}</Label>
              <SelectField
                value={side}
                onValueChange={(v) => setSide(v as "BUY" | "SELL")}
                options={[{ value: "BUY", label: t("common.buy") }, { value: "SELL", label: t("common.sell") }]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("common.quantity")}</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("tradeSimulator.limitPrice")}</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("tradeSimulator.pricePlaceholder")} />
          </div>
          <Button type="submit" disabled={!canSim || !portfolioId || !stockId || sim.isPending} className="w-full">
            {sim.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("tradeSimulator.run")}
          </Button>
          {sim.isError && <p className="text-sm text-loss">{(sim.error as Error).message}</p>}
        </form>

        <div className="space-y-4">
          {!result && !sim.isPending && (
            <EmptyState title={t("tradeSimulator.emptyTitle")} description={t("tradeSimulator.emptyDesc")} />
          )}
          {result && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label={t("tradeSimulator.cashBefore")} value={result.cashBefore.toLocaleString()} />
                <StatTile label={t("tradeSimulator.cashAfter")} value={result.cashAfter.toLocaleString()} />
                <StatTile label={t("tradeSimulator.navAfter")} value={result.navAfter.toLocaleString()} />
                <StatTile
                  label={t("common.compliance")}
                  value={result.compliance.passed ? t("common.passUpper") : t("common.failUpper")}
                />
              </div>
              <AppTable
                toolbar={<h3 className="px-4 pt-4 pb-2 font-semibold">{t("tradeSimulator.weightImpact")}</h3>}
                footer={<ClientTableFooter paging={impactPaging} />}
              >
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.ticker")}</TableHead>
                      <TableHead className="text-end">{t("tradeSimulator.before")}</TableHead>
                      <TableHead className="text-end">{t("tradeSimulator.after")}</TableHead>
                      <TableHead className="text-end">{t("tradeSimulator.delta")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {impactPaging.paged.map((w) => (
                      <TableRow key={w.stockId}>
                        <TableCell className="font-mono">{w.ticker}</TableCell>
                        <TableCell className="text-end font-data">{(w.before * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-end font-data">{(w.after * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-end font-data">{(w.delta * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </AppTable>
              <div className="rounded-2xl border bg-card p-4">
                <h3 className="mb-2 font-semibold">{t("tradeSimulator.complianceChecks")}</h3>
                <ul className="space-y-1 text-sm">
                  {result.compliance.checks.map((c, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0">
                      <span>{c.message || c.checkCode}</span>
                      <Badge variant={c.result === "pass" ? "default" : "destructive"}>{c.result}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

export function OrdersPage() {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canCreate = canPerformAction("order.mutate", { role, username });
  const canApprove = canPerformAction("order.approve", { role, username });
  const canFill = canPerformAction("order.mutate", { role, username });
  const qc = useQueryClient();
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const { data: ordersRes, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => listOrders() });
  const orders = ordersRes?.data ?? [];
  const paging = useClientTablePage(orders, String(orders.length));

  const [portfolioId, setPortfolioId] = useState("");
  const [stockId, setStockId] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("100");
  const [broker, setBroker] = useState("");

  const create = useMutation({
    mutationFn: () => createOrder({ portfolioId, stockId, side, quantity: Number(quantity), broker: broker || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
  const transition = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => transitionOrder(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
  const fill = useMutation({
    mutationFn: ({ id, fillQty, fillPrice }: { id: string; fillQty: number; fillPrice: number }) =>
      recordFill(id, { fillQty, fillPrice }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  return (
    <Shell>
      <PageHeader title={t("orders.title")} description={t("orders.description")} />
      {canCreate ? (
      <form
        className="mb-4 grid gap-2 rounded-2xl border bg-card p-4 md:grid-cols-6"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <SelectField
          value={portfolioId}
          onValueChange={setPortfolioId}
          options={customers.filter((c) => c.portfolioId).map((c) => ({ value: c.portfolioId, label: c.name }))}
          placeholder={t("common.portfolio")}
        />
        <SelectField
          value={stockId}
          onValueChange={setStockId}
          options={(stocks as StockData[]).map((s) => ({ value: s.id, label: s.ticker }))}
          placeholder={t("common.stock")}
        />
        <SelectField value={side} onValueChange={(v) => setSide(v as "BUY" | "SELL")} options={[{ value: "BUY", label: t("common.buy") }, { value: "SELL", label: t("common.sell") }]} />
        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={t("common.qty")} />
        <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder={t("common.broker")} />
        <Button type="submit" disabled={!portfolioId || !stockId || create.isPending}>{t("orders.createDraft")}</Button>
      </form>
      ) : null}
      {create.isError && <p className="mb-2 text-sm text-loss">{(create.error as Error).message}</p>}

      <AppTable
        loading={isLoading}
        footer={<ClientTableFooter paging={paging} />}
      >
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.side")}</TableHead>
              <TableHead>{t("common.qty")}</TableHead>
              <TableHead>{t("common.filled")}</TableHead>
              <TableHead>{t("common.broker")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>{t("common.loading")}</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={6}><EmptyState title={t("orders.emptyTitle")} description={t("orders.emptyDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((o) => (
              <TableRow key={o.id}>
                <TableCell><Badge>{o.status}</Badge></TableCell>
                <TableCell className="font-mono">{o.side}</TableCell>
                <TableCell className="font-data">{o.quantity}</TableCell>
                <TableCell className="font-data">{o.filledQuantity}</TableCell>
                <TableCell>{o.broker || t("common.na")}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  {o.status === "draft" && canApprove && (
                    <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: o.id, status: "approved" })}>{t("common.approve")}</Button>
                  )}
                  {o.status === "approved" && canFill && (
                    <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: o.id, status: "sent" })}>{t("common.send")}</Button>
                  )}
                  {(o.status === "approved" || o.status === "sent" || o.status === "partial") && canFill && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const rem = Number(o.quantity) - Number(o.filledQuantity);
                        const px = window.prompt(t("orders.fillPricePrompt"), o.limitPrice || "");
                        if (!px) return;
                        fill.mutate({ id: o.id, fillQty: rem, fillPrice: Number(px) });
                      }}
                    >
                      {t("orders.fillRemaining")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}
