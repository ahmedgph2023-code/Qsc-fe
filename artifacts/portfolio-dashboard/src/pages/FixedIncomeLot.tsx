import { Link, useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, StatTile, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { getFiLotDailyPnl, getFiPortfolioLots } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const qar = (v: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", maximumFractionDigits: 2 }).format(v);

export default function FixedIncomeLot() {
  const { t } = useTranslation();
  const { portfolioId, lotId } = useParams<{ portfolioId: string; lotId: string }>();
  const { data: lots = [] } = useQuery({
    queryKey: ["fi-lots", portfolioId],
    queryFn: () => getFiPortfolioLots(portfolioId!),
    enabled: !!portfolioId,
  });
  const lot = lots.find((l: any) => l.id === lotId);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["fi-daily", lotId],
    queryFn: () => getFiLotDailyPnl(lotId!),
    enabled: !!lotId,
  });
  const paging = useClientTablePage(rows, String(rows.length));

  const chart = rows.map((r: any) => ({
    date: r.asOfDate,
    bookPnl: Number(r.bookPnl),
    mtmPnl: Number(r.mtmPnl),
    bookValue: Number(r.bookValue),
    marketValue: r.marketValue != null ? Number(r.marketValue) : null,
    couponAccrual: Number(r.couponAccrual),
  }));

  const sumBook = rows.reduce((s: number, r: any) => s + Number(r.bookPnl), 0);
  const sumMtm = rows.reduce((s: number, r: any) => s + Number(r.mtmPnl), 0);
  const latest = rows[rows.length - 1];

  return (
    <Shell>
      <Link href={`/customers-old`} className="soft-link mb-2">
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />{t("common.back")}
      </Link>
      <PageHeader
        title={lot?.ticker || t("fixedIncomeLot.title")}
        description={t("fixedIncomeLot.description", {
          from: lot?.settlementDate || t("common.na"),
          to: lot?.closedDate || lot?.maturityDate || t("common.na"),
        })}
        meta={
          <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("fixedIncomeLot.dailyRows", { count: rows.length })}
          </span>
        }
      />

      <div className="metric-strip stagger">
        <StatTile label={t("fixedIncomeLot.face")} value={Number(lot?.faceAmount || 0)} format="currency" />
        <StatTile label={t("fixedIncomeLot.sumBookPnl")} value={sumBook} format="currency" signed tone={sumBook >= 0 ? "gain" : "loss"} />
        <StatTile label={t("fixedIncomeLot.sumMtmPnl")} value={sumMtm} format="currency" signed tone={sumMtm >= 0 ? "gain" : "loss"} />
        <StatTile label={t("fixedIncomeLot.latestBookValue")} value={latest ? Number(latest.bookValue) : t("common.na")} format="currency" tone="gold" />
      </div>

      <div className="panel mb-6 h-80">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-gold">{t("fixedIncomeLot.chartTitle")}</p>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: 8 }}
              formatter={(v: number, name: string) => [qar(v), name]}
            />
            <Legend />
            <Line type="monotone" dataKey="couponAccrual" name={t("fixedIncomeLot.dailyCoupon")} stroke="hsl(var(--gold))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="bookPnl" name={t("fixedIncomeLot.bookPnl")} stroke="hsl(152 69% 51%)" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="mtmPnl" name={t("fixedIncomeLot.mtmPnl")} stroke="hsl(199 89% 60%)" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <AppTable footer={<ClientTableFooter paging={paging} />}>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.periodDays")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.couponAccrual")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.amort")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.bookPnl")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.bookValue")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.mtmPnl")}</TableHead>
              <TableHead className="text-end">{t("fixedIncomeLot.marketValue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows cols={8} />
            ) : paging.paged.map((r: any) => (
              <TableRow key={r.asOfDate}>
                <TableCell className="font-mono text-xs">{r.asOfDate}</TableCell>
                <TableCell className="text-end font-data">{r.periodActualDays ?? t("common.na")}</TableCell>
                <TableCell className="text-end font-data text-gold">{Number(r.couponAccrual).toFixed(4)}</TableCell>
                <TableCell className="text-end font-data">{Number(r.amortization).toFixed(4)}</TableCell>
                <TableCell className="text-end font-data">{Number(r.bookPnl).toFixed(4)}</TableCell>
                <TableCell className="text-end font-data">{qar(Number(r.bookValue))}</TableCell>
                <TableCell className="text-end font-data">{Number(r.mtmPnl).toFixed(4)}</TableCell>
                <TableCell className="text-end font-data">{r.marketValue != null ? qar(Number(r.marketValue)) : t("common.na")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}
