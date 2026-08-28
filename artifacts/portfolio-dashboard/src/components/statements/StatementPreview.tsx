import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  AccountStatement,
  ClientStatement,
  PortfolioStatement,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
  StatementMoney,
} from "@/lib/statement-types";
import { cn } from "@/lib/utils";

export function formatQar(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function MoneyText({ money, className }: { money: StatementMoney; className?: string }) {
  if (money.value == null) {
    return (
      <span className={cn("text-muted-foreground", className)} title={money.reason}>
        —
      </span>
    );
  }
  return (
    <bdi dir="ltr" className={cn("font-data tabular-nums", className)}>
      {formatQar(money.value)}
    </bdi>
  );
}

function Num({ value, className }: { value: number | null | undefined; className?: string }) {
  return (
    <bdi dir="ltr" className={cn("font-data tabular-nums", className)}>
      {formatQar(value)}
    </bdi>
  );
}

function wrapTable(children: ReactNode) {
  return <div className="overflow-x-auto">{children}</div>;
}

function PortfolioPreview({ stmt }: { stmt: PortfolioStatement }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {stmt.missingCloses.length > 0 ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {t("statements.missingCloses", { tickers: stmt.missingCloses.join(", ") })}
        </p>
      ) : null}
      {stmt.sectors.map((sector) => (
        <div key={`${sector.sectorCode || "na"}-${sector.sectorName}`}>
          <h3 className="mb-2 text-sm font-semibold">
            {sector.sectorName}
            <span className="ms-2 font-data text-muted-foreground">
              {sector.weightPct == null ? "" : `${formatQar(sector.weightPct)}%`}
            </span>
          </h3>
          {wrapTable(
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("statements.col.company")}</TableHead>
                  <TableHead>{t("common.ticker")}</TableHead>
                  <TableHead className="text-end">{t("common.qty")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.cost")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.shareCost")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.close")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.market")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.displayedProfit")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sector.lines.map((line) => (
                  <TableRow key={`${line.ticker}-${line.lineNo}`}>
                    <TableCell>{line.companyName}</TableCell>
                    <TableCell className="font-data">{line.ticker}</TableCell>
                    <TableCell className="text-end"><Num value={line.quantity} /></TableCell>
                    <TableCell className="text-end"><Num value={line.costValue} /></TableCell>
                    <TableCell className="text-end"><Num value={line.shareCost} /></TableCell>
                    <TableCell className="text-end">
                      {line.priceSource === "missing_close" ? (
                        <span className="text-muted-foreground" title={t("statements.missingCloseHint")}>—</span>
                      ) : (
                        <Num value={line.closePrice} />
                      )}
                    </TableCell>
                    <TableCell className="text-end"><Num value={line.marketValue} /></TableCell>
                    <TableCell className="text-end"><MoneyText money={line.displayedProfit} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>,
          )}
        </div>
      ))}
      <FooterGrid
        items={[
          [t("statements.footer.cost"), <Num key="c" value={stmt.grandTotalCost} />],
          [t("statements.footer.market"), <Num key="m" value={stmt.grandTotalMarketValue} />],
          [t("statements.footer.expectedSellComm"), <MoneyText key="e" money={stmt.footer.expectedSellCommission} />],
          [t("statements.footer.drCr"), <MoneyText key="d" money={stmt.footer.drCrBalance} />],
          [t("statements.footer.clientNetCash"), <MoneyText key="n" money={stmt.footer.clientNetCashBalance} />],
          [t("statements.footer.nav"), <MoneyText key="v" money={stmt.footer.netAssetValue} />],
          [t("statements.footer.cashLedger"), <MoneyText key="k" money={stmt.footer.cashLedgerBalance} />],
          [t("statements.footer.realizedTrading"), <MoneyText key="r" money={stmt.footer.realizedTradingPl} />],
        ]}
      />
    </div>
  );
}

function AccountPreview({ stmt }: { stmt: AccountStatement }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("statements.accountOpenClose", {
          open: formatQar(stmt.openingBalance),
          close: formatQar(stmt.closingBalance),
          count: stmt.transactionCount,
        })}
      </p>
      {wrapTable(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("statements.col.postDate")}</TableHead>
              <TableHead>{t("statements.col.transType")}</TableHead>
              <TableHead>{t("statements.col.description")}</TableHead>
              <TableHead className="text-end">{t("statements.col.debit")}</TableHead>
              <TableHead className="text-end">{t("statements.col.credit")}</TableHead>
              <TableHead className="text-end">{t("statements.col.balance")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stmt.lines.map((line, i) => (
              <TableRow key={`${line.postDate}-${line.transNo ?? i}`} className={line.isOpening ? "bg-muted/40" : undefined}>
                <TableCell className="font-data">{line.postDate}</TableCell>
                <TableCell>{line.transType}</TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell className="text-end"><Num value={line.debit} /></TableCell>
                <TableCell className="text-end"><Num value={line.credit} /></TableCell>
                <TableCell className="text-end"><Num value={line.balance} /></TableCell>
                <TableCell>{line.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      )}
    </div>
  );
}

function SummaryPreview({ stmt }: { stmt: RealizedSummaryStatement }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {wrapTable(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("statements.col.company")}</TableHead>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead className="text-end">{t("statements.col.tradingProfit")}</TableHead>
              <TableHead className="text-end">{t("statements.col.dividends")}</TableHead>
              <TableHead className="text-end">{t("statements.col.totalProfit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stmt.lines.map((line) => (
              <TableRow key={line.ticker}>
                <TableCell>{line.companyName}</TableCell>
                <TableCell className="font-data">{line.ticker}</TableCell>
                <TableCell className="text-end"><Num value={line.tradingProfit} /></TableCell>
                <TableCell className="text-end"><MoneyText money={line.distributedDividends} /></TableCell>
                <TableCell className="text-end"><MoneyText money={line.totalProfit} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      )}
      <FooterGrid
        items={[
          [t("statements.footer.tradingTotal"), <Num key="t" value={stmt.tradingProfitTotal} />],
          [t("statements.footer.realizedPl"), <MoneyText key="r" money={stmt.footer.realizedProfitLoss} />],
          [t("statements.footer.expectedPl"), <MoneyText key="e" money={stmt.footer.expectedProfitLoss} />],
          [t("statements.footer.netPl"), <MoneyText key="n" money={stmt.footer.netProfitLoss} />],
          [t("statements.footer.receivedProfits"), <MoneyText key="p" money={stmt.footer.receivedProfits} />],
          [t("statements.footer.paidCapital"), <MoneyText key="c" money={stmt.footer.paidCapital} />],
        ]}
      />
    </div>
  );
}

function DetailsPreview({ stmt }: { stmt: RealizedDetailsStatement }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      {stmt.stocks.map((stock) => (
        <div key={stock.ticker}>
          <h3 className="mb-2 text-sm font-semibold">
            {stock.companyName} <span className="font-data text-muted-foreground">{stock.ticker}</span>
          </h3>
          {wrapTable(
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("statements.col.invNo")}</TableHead>
                  <TableHead>{t("common.side")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.buyQty")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.sellQty")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.balance")}</TableHead>
                  <TableHead className="text-end">{t("common.price")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.dayResult")}</TableHead>
                  <TableHead className="text-end">{t("statements.col.cumulative")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.lines.map((line, i) => (
                  <TableRow key={`${line.invNo ?? "open"}-${line.date}-${i}`} className={line.isOpening ? "bg-muted/40" : undefined}>
                    <TableCell className="font-data">{line.date}</TableCell>
                    <TableCell className="font-data">{line.invNo ?? "—"}</TableCell>
                    <TableCell>{line.side}</TableCell>
                    <TableCell className="text-end"><Num value={line.buyQty} /></TableCell>
                    <TableCell className="text-end"><Num value={line.sellQty} /></TableCell>
                    <TableCell className="text-end"><Num value={line.shareBalance} /></TableCell>
                    <TableCell className="text-end"><Num value={line.price} /></TableCell>
                    <TableCell className="text-end"><Num value={line.dayResult} /></TableCell>
                    <TableCell className="text-end"><Num value={line.profitLossCumulative} /></TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">{t("statements.totals")}</TableCell>
                  <TableCell className="text-end"><Num value={stock.totals.buyQty} /></TableCell>
                  <TableCell className="text-end"><Num value={stock.totals.sellQty} /></TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-end"><Num value={stock.totals.dayResult} /></TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>,
          )}
        </div>
      ))}
    </div>
  );
}

function FooterGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border/70 px-3 py-2">
          <dt className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
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
