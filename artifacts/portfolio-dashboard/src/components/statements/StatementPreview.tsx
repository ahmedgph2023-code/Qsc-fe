import { Fragment, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Building2,
  Factory,
  MoreHorizontal,
  Radio,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { StatsSummaryBar, type StatsSummaryItem } from "@/components/phase1/StatsSummaryBar";
import { useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import type {
  AccountStatement,
  ClientStatement,
  PortfolioStatement,
  PortfolioStatementSector,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
  StatementMoney,
} from "@/lib/statement-types";
import { cn } from "@/lib/utils";

const TOTAL_ROW =
  "statement-total-row h-16 border-0 bg-[#0b1f4a] text-white hover:bg-[#0b1f4a] [&_td]:!bg-[#0b1f4a] [&_td]:text-white hover:[&_td]:!bg-[#0b1f4a]";
const totalMuted = "text-[#c5d4f0]";
const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491] first:text-center";
const emptyClass = "text-[#9aa6ba]";
const cellPy = { paddingTop: 0, paddingBottom: 0 } as const;
const TABLE_WRAP = "clients-table-wrap overflow-x-auto";

export function formatQar(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

/** Portfolio statement amounts — client requested 3 decimal places (س-03). */
export function formatStatementAmount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-QA", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value);
}

function signedClass(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value === 0) return undefined;
  return value > 0 ? "text-[#159957]" : "text-[#e04444]";
}

export function MoneyText({
  money,
  className,
  signed = false,
}: {
  money: StatementMoney;
  className?: string;
  signed?: boolean;
}) {
  if (money.value == null) {
    return (
      <span className={cn(emptyClass, className)} title={money.reason}>
        —
      </span>
    );
  }
  return (
    <bdi dir="ltr" className={cn("font-data tabular-nums", signed && signedClass(money.value), className)}>
      {formatQar(money.value)}
    </bdi>
  );
}

function Num({
  value,
  className,
  signed = false,
  decimals = 2,
}: {
  value: number | null | undefined;
  className?: string;
  signed?: boolean;
  decimals?: 2 | 3;
}) {
  const formatted = decimals === 3 ? formatStatementAmount(value) : formatQar(value);
  return (
    <bdi dir="ltr" className={cn("font-data tabular-nums", signed && signedClass(value), className)}>
      {formatted}
    </bdi>
  );
}

function StmtMoneyText({
  money,
  className,
  signed = false,
}: {
  money: StatementMoney;
  className?: string;
  signed?: boolean;
}) {
  if (money.value == null) {
    return (
      <span className={cn(emptyClass, className)} title={money.reason}>
        —
      </span>
    );
  }
  return (
    <bdi dir="ltr" className={cn("font-data tabular-nums", signed && signedClass(money.value), className)}>
      {formatStatementAmount(money.value)}
    </bdi>
  );
}

function StatementTableShell({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e1e7f0] bg-white dark:border-white/10 dark:bg-[var(--color-surface-elevated)]">
      {children}
      {footer}
    </div>
  );
}

const SECTOR_TONES = [
  {
    row: "border-s-4 border-s-[#2161ed] bg-[#eef3ff] hover:bg-[#eef3ff]",
    icon: "bg-white text-[#155eef] shadow-[0_1px_2px_rgba(21,94,239,0.12)]",
    chip: "bg-[#d9e6ff] text-[#155eef]",
    Icon: Building2,
  },
  {
    row: "border-s-4 border-s-[#16a05d] bg-[#eef8f2] hover:bg-[#eef8f2]",
    icon: "bg-white text-[#159957] shadow-[0_1px_2px_rgba(21,153,87,0.12)]",
    chip: "bg-[#d5f0e1] text-[#0f7a48]",
    Icon: ShoppingBag,
  },
  {
    row: "border-s-4 border-s-[#7257e8] bg-[#f3efff] hover:bg-[#f3efff]",
    icon: "bg-white text-[#6849dd] shadow-[0_1px_2px_rgba(104,73,221,0.12)]",
    chip: "bg-[#e3dcff] text-[#5a3fd0]",
    Icon: Factory,
  },
  {
    row: "border-s-4 border-s-[#ef7b21] bg-[#fff4eb] hover:bg-[#fff4eb]",
    icon: "bg-white text-[#ed741c] shadow-[0_1px_2px_rgba(237,116,28,0.12)]",
    chip: "bg-[#ffe0c7] text-[#c45e12]",
    Icon: Radio,
  },
  {
    row: "border-s-4 border-s-[#e8a800] bg-[#fff8e8] hover:bg-[#fff8e8]",
    icon: "bg-white text-[#c48400] shadow-[0_1px_2px_rgba(196,132,0,0.12)]",
    chip: "bg-[#ffecc2] text-[#9a6b00]",
    Icon: Shield,
  },
  {
    row: "border-s-4 border-s-[#11a7b8] bg-[#eef8fa] hover:bg-[#eef8fa]",
    icon: "bg-white text-[#0793a4] shadow-[0_1px_2px_rgba(7,147,164,0.12)]",
    chip: "bg-[#d0eef2] text-[#067888]",
    Icon: MoreHorizontal,
  },
] as const;

function sectorQty(sector: PortfolioStatementSector) {
  return sector.lines.reduce((sum, line) => sum + line.quantity, 0);
}

function moneyKpi(money: StatementMoney) {
  return <AnimatedNumber value={money.value} format="currency" />;
}

export function PortfolioStatementStats({ stmt }: { stmt: PortfolioStatement }) {
  const { t } = useTranslation();
  const unsigned = t("statements.kpiUnsignedHint");
  const fromLedger = t("statements.kpiLedgerHint");
  const f = stmt.footer;
  const kpiItems: StatsSummaryItem[] = [
    {
      id: "cost",
      icon: "/Open cost.png",
      label: t("statements.footer.cost"),
      value: <AnimatedNumber value={stmt.grandTotalCost} format="currency" />,
      hint: fromLedger,
    },
    {
      id: "market",
      icon: "/Equity.png",
      label: t("statements.footer.market"),
      value: <AnimatedNumber value={stmt.grandTotalMarketValue} format="currency" />,
      hint: stmt.grandTotalMarketValue == null ? unsigned : fromLedger,
    },
    {
      id: "sellComm",
      icon: "/chart.png",
      label: t("statements.footer.expectedSellComm"),
      value: moneyKpi(f.expectedSellCommission),
      hint: f.expectedSellCommission.value == null ? unsigned : fromLedger,
    },
    {
      id: "drcr",
      icon: "/analytics.png",
      label: t("statements.footer.drCr"),
      value: moneyKpi(f.drCrBalance),
      hint: f.drCrBalance.value == null ? unsigned : fromLedger,
    },
    {
      id: "netCash",
      icon: "/Cash-2.png",
      label: t("statements.footer.clientNetCash"),
      value: moneyKpi(f.clientNetCashBalance),
      hint: f.clientNetCashBalance.value == null ? unsigned : fromLedger,
    },
    {
      id: "nav",
      icon: "/Holdings + cash.png",
      label: t("statements.footer.nav"),
      value: moneyKpi(f.netAssetValue),
      hint: f.netAssetValue.value == null ? unsigned : fromLedger,
    },
    {
      id: "cashLedger",
      icon: "/Net cash invested.png",
      label: t("statements.footer.cashLedger"),
      value: moneyKpi(f.cashLedgerBalance),
      hint: f.cashLedgerBalance.value == null ? unsigned : fromLedger,
    },
    {
      id: "realized",
      icon: "/Realized P&L.png",
      label: t("statements.footer.realizedTrading"),
      value: moneyKpi(f.realizedTradingPl),
      hint: f.realizedTradingPl.value == null ? unsigned : fromLedger,
      valueClassName:
        f.realizedTradingPl.value == null
          ? undefined
          : f.realizedTradingPl.value >= 0
            ? "text-[var(--color-positive)]"
            : "text-loss",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <StatsSummaryBar
          ariaLabel={t("statements.kpiAria")}
          iconSize={64}
          items={kpiItems.slice(0, 4)}
        />
        <StatsSummaryBar
          ariaLabel={t("statements.kpiAria")}
          iconSize={64}
          items={kpiItems.slice(4)}
        />
      </div>
    </div>
  );
}

function PortfolioPreview({ stmt }: { stmt: PortfolioStatement }) {
  const { t } = useTranslation();
  const lineCount = stmt.sectors.reduce((n, s) => n + s.lines.length, 0);
  const grandQty = stmt.sectors.reduce((sum, s) => sum + sectorQty(s), 0);
  const flat = useMemo(
    () =>
      stmt.sectors.flatMap((sector, si) =>
        sector.lines.map((line) => ({ sector, si, line })),
      ),
    [stmt],
  );
  const resetKey = `${stmt.investor.accountId}|${stmt.dates.asOf}|${lineCount}`;
  const paging = useClientTablePage(flat, resetKey);
  const shownSectors = new Set<number>();

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {stmt.missingCloses.length > 0 ? (
        <p className="flex min-h-11 items-center gap-3 rounded-[10px] border border-[#ffd9a0] bg-[#fffaf1] px-4 py-2 text-xs text-[#805c25]">
          <AlertTriangle className="size-4 shrink-0" />
          {t("statements.missingCloses", { tickers: stmt.missingCloses.join(", ") })}
        </p>
      ) : null}

      <StatementTableShell footer={pagingFooter(paging)}>
        <Table
          className="min-w-[80rem] table-fixed border-separate border-spacing-0"
          wrapClassName={TABLE_WRAP}
        >
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(thClass, "w-12")}>#</TableHead>
              <TableHead className={cn(thClass, "w-[16rem]")}>{t("statements.col.company")}</TableHead>
              <TableHead className={cn(thClass, "w-[6rem]")}>{t("common.ticker")}</TableHead>
              <TableHead className={cn(thClass, "w-[5.5rem] text-end")}>{t("statements.col.compId")}</TableHead>
              <TableHead className={cn(thClass, "w-[9rem] text-end")}>{t("common.qty")}</TableHead>
              <TableHead className={cn(thClass, "w-[10rem] text-end")}>{t("statements.col.costTotal")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.shareCost")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.close")}</TableHead>
              <TableHead className={cn(thClass, "w-[7.5rem] text-end")}>{t("statements.col.closeDate")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.market")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.breakEven")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.displayedProfit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody key={`port-${paging.page}-${paging.pageSize}`}>
            {paging.paged.map((item, idx) => {
              const { sector, si, line } = item;
              const showSector = !shownSectors.has(si);
              shownSectors.add(si);
              const tone = SECTOR_TONES[si % SECTOR_TONES.length];
              const Icon = tone.Icon;
              const companyNo = paging.start + idx + 1;
              return (
                <Fragment key={`port-${paging.start + idx}`}>
                  {showSector ? (
                    <TableRow className={cn("border-y border-[#d7e0ee]", tone.row)}>
                      <TableCell colSpan={12} className="px-4" style={cellPy}>
                        <div className="flex h-12 w-full items-center gap-3 text-start">
                          <span className="w-7 shrink-0 text-center text-[11px] font-bold tabular-nums text-[#8a97b0]">
                            {String(si + 1).padStart(2, "0")}
                          </span>
                          <span className={cn("grid size-8 shrink-0 place-items-center rounded-[10px]", tone.icon)}>
                            <Icon className="size-4" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 truncate text-[13px] font-bold tracking-tight text-[#16305f]">
                            {sector.sectorName}
                          </span>
                          <span className={cn("ms-1 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", tone.chip)}>
                            {t("statements.companyCount", { count: sector.lines.length })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow className="h-[52px] border-b border-[#eef2f7] bg-white text-[13px] text-[#172b55] hover:bg-[#f7f9fd]">
                    <TableCell className="px-3.5 text-center text-[11px] font-medium tabular-nums text-[#8a97b0]" style={cellPy}>
                      {companyNo}
                    </TableCell>
                    <TableCell className="px-3.5 font-semibold text-[#17356d]" style={cellPy}>{line.companyName}</TableCell>
                    <TableCell className="px-3.5" style={cellPy}>
                      <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-[#eef4ff] px-2 text-[11px] font-bold text-[#175cd3]">
                        {line.ticker}
                      </span>
                    </TableCell>
                    <TableCell className="px-3.5 text-end font-data tabular-nums text-[#657491]" style={cellPy}>
                      {line.compId ?? "—"}
                    </TableCell>
                    <TableCell className="px-3.5 text-end font-semibold tabular-nums" style={cellPy}>
                      <Num value={line.quantity} decimals={3} />
                    </TableCell>
                    <TableCell className="px-3.5 text-end font-bold text-[#e04444]" style={cellPy}>
                      <Num value={line.costValue} decimals={3} className="font-bold text-[#e04444]" />
                    </TableCell>
                    <TableCell className="px-3.5 text-end font-semibold tabular-nums" style={cellPy}>
                      <Num value={line.shareCost} decimals={3} />
                    </TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}>
                      {line.priceSource === "missing_close" ? (
                        <span className={emptyClass} title={t("statements.missingCloseHint")}>—</span>
                      ) : (
                        <Num value={line.closePrice} decimals={3} />
                      )}
                    </TableCell>
                    <TableCell className="px-3.5 text-end font-mono text-xs text-[#657491]" style={cellPy}>
                      {line.closeDate ?? "—"}
                    </TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}>
                      {line.marketValue == null ? <span className={emptyClass}>—</span> : <Num value={line.marketValue} decimals={3} />}
                    </TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}>
                      <StmtMoneyText money={line.breakEven} />
                    </TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}>
                      <StmtMoneyText money={line.displayedProfit} signed />
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
            <TableRow className={TOTAL_ROW}>
              <TableCell className={cn("px-3.5 text-center text-[11px] font-bold", totalMuted)} style={cellPy}>#</TableCell>
              <TableCell className="px-3.5" colSpan={3} style={cellPy}>
                <span className="block text-[14px] font-bold text-white">{t("statements.totalAllSectors")}</span>
                <span className={cn("mt-0.5 block text-[10px] font-medium", totalMuted)}>
                  {t("statements.totalSubtitle", { sectors: stmt.sectors.length, rows: lineCount })}
                </span>
              </TableCell>
              <TableCell className="px-3.5 text-end text-[13px] font-bold tabular-nums text-white" style={cellPy}>
                <Num value={grandQty} decimals={3} className="text-white" />
              </TableCell>
              <TableCell className="px-3.5 text-end text-[14px] font-extrabold text-[#ffb4a8]" style={cellPy}>
                <Num value={stmt.grandTotalCost} decimals={3} className="font-extrabold text-[#ffb4a8]" />
              </TableCell>
              <TableCell className={cn("px-3.5 text-end", totalMuted)} style={cellPy}>—</TableCell>
              <TableCell className={cn("px-3.5 text-end", totalMuted)} style={cellPy}>—</TableCell>
              <TableCell className={cn("px-3.5 text-end", totalMuted)} style={cellPy}>—</TableCell>
              <TableCell className="px-3.5 text-end text-white" style={cellPy}>
                {stmt.grandTotalMarketValue == null ? <span className={totalMuted}>—</span> : <Num value={stmt.grandTotalMarketValue} decimals={3} className="text-white" />}
              </TableCell>
              <TableCell className={cn("px-3.5 text-end", totalMuted)} style={cellPy}>—</TableCell>
              <TableCell className={cn("px-3.5 text-end", totalMuted)} style={cellPy}>—</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </StatementTableShell>
 
    </div>
  );
}

function pagingFooter(paging: ReturnType<typeof useClientTablePage>) {
  return (
    <TablePageFooter
      total={paging.total}
      page={paging.page}
      pageSize={paging.pageSize}
      pageSizes={paging.pageSizes}
      loading={paging.busy}
      onPageChange={paging.setPage}
      onPageSizeChange={paging.setPageSize}
    />
  );
}

function AccountPreview({ stmt }: { stmt: AccountStatement }) {
  const { t } = useTranslation();
  const paging = useClientTablePage(stmt.lines, `${stmt.investor.accountId}|${stmt.dates.from}|${stmt.dates.to}|${stmt.lines.length}`);
  return (
    <div className="p-4 sm:p-5">
      <p className="mb-4 text-sm text-[#657491]">
        {t("statements.accountOpenClose", {
          open: formatQar(stmt.openingBalance),
          close: formatQar(stmt.closingBalance),
          count: stmt.transactionCount,
        })}
      </p>
      <StatementTableShell footer={pagingFooter(paging)}>
        <Table className="min-w-[64rem] table-fixed border-separate border-spacing-0" wrapClassName={TABLE_WRAP}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(thClass, "w-[7.5rem]")}>{t("statements.col.postDate")}</TableHead>
              <TableHead className={cn(thClass, "w-[8.5rem]")}>{t("statements.col.transType")}</TableHead>
              <TableHead className={thClass}>{t("statements.col.description")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.debit")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.credit")}</TableHead>
              <TableHead className={cn(thClass, "w-36 text-end")}>{t("statements.col.balance")}</TableHead>
              <TableHead className={cn(thClass, "w-28")}>{t("common.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody key={`acct-${paging.page}-${paging.pageSize}`}>
            {paging.paged.map((line, i) => (
              <TableRow
                key={`acct-${paging.start + i}`}
                className={cn("h-[52px] border-b border-[#eef2f7] bg-white text-[13px] text-[#172b55] hover:bg-[#f7f9fd]", line.isOpening && "bg-[#f8faff]")}
              >
                <TableCell className="px-3.5 font-data" style={cellPy}>{line.postDate}</TableCell>
                <TableCell className="px-3.5" style={cellPy}>{line.transType}</TableCell>
                <TableCell className="px-3.5 font-semibold text-[#17356d]" style={cellPy}>{line.description}</TableCell>
                <TableCell className="px-3.5 text-end" style={cellPy}><Num value={line.debit} /></TableCell>
                <TableCell className="px-3.5 text-end" style={cellPy}><Num value={line.credit} /></TableCell>
                <TableCell className="px-3.5 text-end font-semibold" style={cellPy}><Num value={line.balance} /></TableCell>
                <TableCell className="px-3.5 text-[#657491]" style={cellPy}>{line.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StatementTableShell>
    </div>
  );
}

function SummaryPreview({ stmt }: { stmt: RealizedSummaryStatement }) {
  const { t } = useTranslation();
  const paging = useClientTablePage(
    stmt.lines,
    `${stmt.investor.accountId}|${stmt.dates.mode === "range" ? `${stmt.dates.from}|${stmt.dates.to}` : stmt.dates.asOf}|${stmt.lines.length}`,
  );
  const unsigned = t("statements.kpiUnsignedHint");
  const fromLedger = t("statements.kpiLedgerHint");
  const f = stmt.footer;
  const kpiItems: StatsSummaryItem[] = [
    {
      id: "trading",
      icon: "/Realized P&L.png",
      label: t("statements.footer.tradingTotal"),
      value: <AnimatedNumber value={stmt.tradingProfitTotal} format="currency" />,
      hint: fromLedger,
      valueClassName: signedClass(stmt.tradingProfitTotal),
    },
    {
      id: "realized",
      icon: "/chart.png",
      label: t("statements.footer.realizedPl"),
      value: moneyKpi(f.realizedProfitLoss),
      hint: f.realizedProfitLoss.value == null ? unsigned : fromLedger,
      valueClassName: signedClass(f.realizedProfitLoss.value),
    },
  ];

  return (
    <div className="p-4 sm:p-5">
      <div className="mb-5 space-y-3">
        <StatsSummaryBar ariaLabel={t("statements.kpiSummaryAria")} iconSize={64} items={kpiItems} />
      </div>

      <StatementTableShell footer={pagingFooter(paging)}>
        <Table className="min-w-[40rem] table-fixed border-separate border-spacing-0" wrapClassName={TABLE_WRAP}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(thClass, "w-12")}>#</TableHead>
              <TableHead className={thClass}>{t("statements.col.company")}</TableHead>
              <TableHead className={cn(thClass, "w-[7.5rem]")}>{t("common.ticker")}</TableHead>
              <TableHead className={cn(thClass, "w-[11rem] text-end")}>{t("statements.col.tradingProfit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody key={`sum-${paging.page}-${paging.pageSize}`}>
            {paging.paged.map((line, idx) => (
              <TableRow key={`sum-${paging.start + idx}`} className="h-[52px] border-b border-[#eef2f7] bg-white text-[13px] text-[#172b55] hover:bg-[#f7f9fd]">
                <TableCell className="px-3.5 text-center text-[11px] font-medium tabular-nums text-[#8a97b0]" style={cellPy}>
                  {paging.start + idx + 1}
                </TableCell>
                <TableCell className="px-3.5 font-semibold text-[#17356d]" style={cellPy}>{line.companyName}</TableCell>
                <TableCell className="px-3.5" style={cellPy}>
                  <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-[#eef4ff] px-2 text-[11px] font-bold text-[#175cd3]">
                    {line.ticker}
                  </span>
                </TableCell>
                <TableCell className="px-3.5 text-end font-semibold" style={cellPy}>
                  <Num value={line.tradingProfit} signed />
                </TableCell>
              </TableRow>
            ))}
            <TableRow className={TOTAL_ROW}>
              <TableCell className={cn("px-3.5 text-center text-[11px] font-bold", totalMuted)} style={cellPy}>#</TableCell>
              <TableCell className="px-3.5" colSpan={2} style={cellPy}>
                <span className="block text-[14px] font-bold text-white">{t("statements.totals")}</span>
                <span className={cn("mt-0.5 block text-[10px] font-medium", totalMuted)}>
                  {t("statements.companyCount", { count: stmt.lines.length })}
                </span>
              </TableCell>
              <TableCell className="px-3.5 text-end text-[14px] font-extrabold" style={cellPy}>
                <Num value={stmt.tradingProfitTotal} className={stmt.tradingProfitTotal < 0 ? "text-[#ffb4a8]" : "text-white"} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </StatementTableShell>
 
    </div>
  );
}

function DetailsPreview({ stmt }: { stmt: RealizedDetailsStatement }) {
  const { t } = useTranslation();
  const flat = useMemo(
    () =>
      stmt.stocks.flatMap((stock) =>
        stock.lines.map((line, lineIdx) => ({
          stock,
          line,
          lineIdx,
          isLast: lineIdx === stock.lines.length - 1,
        })),
      ),
    [stmt.stocks],
  );
  const paging = useClientTablePage(
    flat,
    `${stmt.investor.accountId}|${stmt.dates.from}|${stmt.dates.to}|${flat.length}`,
  );
  const shownTickers = new Set<string>();
  return (
    <div className="p-4 sm:p-5">
      <StatementTableShell footer={pagingFooter(paging)}>
        <Table className="min-w-[64rem] table-fixed border-separate border-spacing-0" wrapClassName={TABLE_WRAP}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(thClass, "w-[7.5rem]")}>{t("common.date")}</TableHead>
              <TableHead className={cn(thClass, "w-24")}>{t("statements.col.invNo")}</TableHead>
              <TableHead className={cn(thClass, "w-24")}>{t("common.side")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.buyQty")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("statements.col.sellQty")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.balance")}</TableHead>
              <TableHead className={cn(thClass, "w-28 text-end")}>{t("common.price")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.dayResult")}</TableHead>
              <TableHead className={cn(thClass, "w-32 text-end")}>{t("statements.col.cumulative")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody key={`det-${paging.page}-${paging.pageSize}`}>
            {paging.paged.map((item, idx) => {
              const showStock = !shownTickers.has(item.stock.ticker);
              shownTickers.add(item.stock.ticker);
              const tone = SECTOR_TONES[shownTickers.size % SECTOR_TONES.length];
              return (
                <Fragment key={`det-${paging.start + idx}`}>
                  {showStock ? (
                    <TableRow className={cn("border-y border-[#d7e0ee]", tone.row)}>
                      <TableCell colSpan={9} className="px-4" style={cellPy}>
                        <div className="flex h-12 w-full items-center gap-3 text-start">
                          <span className="min-w-0 truncate text-[13px] font-bold tracking-tight text-[#16305f]">
                            {item.stock.companyName}
                          </span>
                          <span className="inline-flex h-6 min-w-12 items-center justify-center rounded-md bg-white px-2 text-[11px] font-bold text-[#175cd3]">
                            {item.stock.ticker}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow className={cn("h-[52px] border-b border-[#eef2f7] bg-white text-[13px] text-[#172b55] hover:bg-[#f7f9fd]", item.line.isOpening && "bg-[#f8faff]")}>
                    <TableCell className="px-3.5 font-data" style={cellPy}>{item.line.date}</TableCell>
                    <TableCell className="px-3.5 font-data text-[#8a97b0]" style={cellPy}>{item.line.invNo ?? "—"}</TableCell>
                    <TableCell className="px-3.5" style={cellPy}>{item.line.side}</TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}><Num value={item.line.buyQty} /></TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}><Num value={item.line.sellQty} /></TableCell>
                    <TableCell className="px-3.5 text-end font-semibold" style={cellPy}><Num value={item.line.shareBalance} /></TableCell>
                    <TableCell className="px-3.5 text-end" style={cellPy}><Num value={item.line.price} /></TableCell>
                    <TableCell className="px-3.5 text-end font-semibold" style={cellPy}><Num value={item.line.dayResult} signed /></TableCell>
                    <TableCell className="px-3.5 text-end font-semibold" style={cellPy}><Num value={item.line.profitLossCumulative} signed /></TableCell>
                  </TableRow>
                  {item.isLast ? (
                    <TableRow className={TOTAL_ROW}>
                      <TableCell colSpan={3} className="px-3.5 font-bold text-white" style={cellPy}>{t("statements.totals")}</TableCell>
                      <TableCell className="px-3.5 text-end text-white" style={cellPy}><Num value={item.stock.totals.buyQty} className="text-white" /></TableCell>
                      <TableCell className="px-3.5 text-end text-white" style={cellPy}><Num value={item.stock.totals.sellQty} className="text-white" /></TableCell>
                      <TableCell />
                      <TableCell />
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Num value={item.stock.totals.dayResult} className={item.stock.totals.dayResult < 0 ? "text-[#ffb4a8]" : "text-white"} />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </StatementTableShell>
    </div>
  );
}

export function StatementPreview({ stmt }: { stmt: ClientStatement }) {
  if (stmt.kind === "portfolio") return <PortfolioPreview stmt={stmt} />;
  if (stmt.kind === "account") return <AccountPreview stmt={stmt} />;
  if (stmt.kind === "realized_summary") return <SummaryPreview stmt={stmt} />;
  return <DetailsPreview stmt={stmt} />;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function moneyHtml(m: StatementMoney) {
  return m.value == null ? "—" : formatQar(m.value);
}

/** Screen-print HTML. Step 8 replaces this with trading-system layout. */
export function buildStatementPreviewHtml(stmt: ClientStatement): string {
  const title = escapeHtml(stmt.titleEn);
  const name = escapeHtml(stmt.investor.displayName || stmt.investor.nameEn || stmt.investor.nameAr);
  const dates =
    stmt.dates.mode === "as_of"
      ? `As of ${stmt.dates.asOf}`
      : `${stmt.dates.from} → ${stmt.dates.to}`;
  const head = `<h1>${title}</h1><p class="meta">${name} · NIN ${escapeHtml(stmt.investor.nin)} · Acc ${stmt.investor.accountId} · ${escapeHtml(dates)}</p>`;
  if (stmt.kind === "portfolio") {
    const rows = stmt.sectors.flatMap((s) =>
      s.lines.map(
        (l) =>
          `<tr><td>${escapeHtml(l.companyName)}</td><td>${escapeHtml(l.ticker)}</td><td class="num">${formatQar(l.quantity)}</td><td class="num">${formatQar(l.costValue)}</td><td class="num">${formatQar(l.marketValue)}</td><td class="num">${moneyHtml(l.displayedProfit)}</td></tr>`,
      ),
    );
    return `${head}<table><thead><tr><th>Company</th><th>Ticker</th><th>Qty</th><th>Cost</th><th>MV</th><th>P/L</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  }
  if (stmt.kind === "account") {
    const rows = stmt.lines.map(
      (l) =>
        `<tr><td>${escapeHtml(l.postDate)}</td><td>${escapeHtml(l.transType)}</td><td>${escapeHtml(l.description)}</td><td class="num">${formatQar(l.debit)}</td><td class="num">${formatQar(l.credit)}</td><td class="num">${formatQar(l.balance)}</td></tr>`,
    );
    return `${head}<table><thead><tr><th>Date</th><th>Type</th><th>Desc</th><th>Dr</th><th>Cr</th><th>Bal</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  }
  if (stmt.kind === "realized_summary") {
    const rows = stmt.lines.map(
      (l) =>
        `<tr><td>${escapeHtml(l.companyName)}</td><td>${escapeHtml(l.ticker)}</td><td class="num">${formatQar(l.tradingProfit)}</td></tr>`,
    );
    return `${head}<table><thead><tr><th>Company</th><th>Ticker</th><th>Trading P/L</th></tr></thead><tbody>${rows.join("")}</tbody></table><p>Total ${formatQar(stmt.tradingProfitTotal)}</p>`;
  }
  const blocks = stmt.stocks.map((stock) => {
    const rows = stock.lines.map(
      (l) =>
        `<tr><td>${escapeHtml(l.date)}</td><td>${l.invNo ?? ""}</td><td>${escapeHtml(l.side)}</td><td class="num">${formatQar(l.sellQty)}</td><td class="num">${formatQar(l.dayResult)}</td><td class="num">${formatQar(l.profitLossCumulative)}</td></tr>`,
    );
    return `<h2>${escapeHtml(stock.companyName)} ${escapeHtml(stock.ticker)}</h2><table><thead><tr><th>Date</th><th>Inv</th><th>Side</th><th>Sell</th><th>Day</th><th>Cumul</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  });
  return `${head}${blocks.join("")}`;
}
