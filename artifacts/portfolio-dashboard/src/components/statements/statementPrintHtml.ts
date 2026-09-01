import i18n from "@/i18n";
import type {
  AccountStatement,
  ClientStatement,
  PortfolioStatement,
  PortfolioStatementLine,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
  StatementInvestorHeader,
  StatementMoney,
} from "@/lib/statement-types";
import { formatQar, formatStatementAmount } from "@/components/statements/StatementPreview";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return escapeHtml(iso);
  return `${d}/${m}/${y}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return escapeHtml(iso);
  const date = d.toLocaleDateString("en-GB", { timeZone: "Asia/Qatar" });
  const time = d.toLocaleTimeString("en-GB", { timeZone: "Asia/Qatar", hour12: true });
  return `${date} ${time}`;
}

function money(m: StatementMoney) {
  return m.value == null ? "" : formatQar(m.value);
}

function num(n: number | null | undefined) {
  return n == null ? "" : formatQar(n);
}

function price3(n: number | null | undefined) {
  return n == null ? "" : formatStatementAmount(n);
}

function field(label: string, value: string | null | undefined) {
  return `<div class="field"><span class="lbl">${escapeHtml(label)}</span><span class="val">${escapeHtml(value || "")}</span></div>`;
}

function logoUrl() {
  const base = (typeof window !== "undefined" ? window.location.origin : "") + (import.meta.env.BASE_URL || "/");
  return `${base.replace(/\/$/, "")}/logo.png`;
}

function signedNum(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "";
  const abs = formatQar(Math.abs(n));
  return n < 0 ? `(${abs})` : abs;
}

function signedMoney(m: StatementMoney) {
  return m.value == null ? "" : signedNum(m.value);
}

function investorBlockPortfolio(inv: StatementInvestorHeader) {
  const name = inv.displayName || inv.nameAr || inv.nameEn;
  const tradeQe = inv.tradingAccountQe || inv.cAccount;
  return `
    <div class="id-grid id-grid--client">
      ${field("Client Name", name)}
      ${field("Account Name", name)}
      ${field("Account Type", inv.accountTypePrinted || inv.clientType)}
      ${field("Client No.", inv.clientCode)}
      ${field("NIN QE", inv.nin)}
      ${field("Address", inv.address)}
      ${field("Tr. Acc. QE", tradeQe)}
      ${field("Fax", inv.fax)}
      ${field("Mobile", inv.mobile)}
      ${field("P.O.B.", inv.poBox)}
      ${field("City", inv.city)}
      ${field("Country", inv.country)}
    </div>`;
}

function investorBlock(inv: StatementInvestorHeader, extra: Array<[string, string | null | undefined]>) {
  const name = inv.displayName || inv.nameAr || inv.nameEn;
  const tradeQe = inv.tradingAccountQe || inv.cAccount;
  return `
    <div class="id-grid">
      ${field("Client Name", name)}
      ${field("Client No.", inv.clientCode)}
      ${field("Client ID", String(inv.accountId))}
      ${field("NIN", inv.nin)}
      ${field("Address", inv.address)}
      ${field("P.O. Box", inv.poBox)}
      ${field("Country", inv.country)}
      ${field("City", inv.city)}
      ${field("Mobile", inv.mobile)}
      ${field("Fax", inv.fax)}
      ${field("Trade Acc. QE", tradeQe)}
      ${field("Currency", inv.currency)}
      ${field("Account Type", inv.accountTypePrinted || inv.clientType)}
      ${extra.map(([l, v]) => field(l, v)).join("")}
    </div>`;
}

function printChrome(
  stmt: ClientStatement,
  periodLine: string,
  body: string,
  investorHtml: string,
) {
  const lang = i18n.language === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const title = lang === "ar" ? stmt.titleAr : stmt.titleEn;
  const companyName = stmt.company?.legalName || "Qatar Co. for Securities";
  const printedAt = stmt.print?.printedAtIso || new Date().toISOString();
  return `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 12mm 10mm 16mm; }
  html, body { background: #fff; color: #111; }
  body {
    font-family: ${lang === "ar" ? "'Cairo','Alexandria',Arial,sans-serif" : "Arial,'Segoe UI',sans-serif"};
    font-size: 10px; line-height: 1.35; margin: 0; padding: 8px 4px 24px;
  }
  .sheet-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px; border-bottom: 2px solid #1a365d; padding-bottom: 8px; }
  .sheet-head img { height: 42px; width: auto; }
  .titles { flex: 1; }
  .titles .co { font-size: 13px; font-weight: 700; color: #1a365d; }
  .titles h1 { font-size: 15px; margin: 2px 0 0; }
  .titles .ar { font-size: 13px; margin: 0; }
  .period { margin: 6px 0 4px; font-weight: 700; }
  .print-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 9px; color: #444; margin-bottom: 8px; }
  .client-row { display: grid; grid-template-columns: 1fr 240px; gap: 12px; align-items: start; margin-bottom: 10px; }
  .security-alloc { border: 1px solid #ccd6e4; background: #f8faff; padding: 8px; font-size: 9px; }
  .security-alloc h3 { margin: 0 0 6px; font-size: 10px; text-transform: uppercase; color: #1a365d; }
  .security-alloc table { margin: 0; font-size: 9px; }
  .security-alloc td { padding: 2px 4px; border: none; }
  .security-alloc td.num { text-align: end; }
  .id-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px 12px; margin-bottom: 0; }
  .id-grid--client { grid-template-columns: 1fr; }
  .field { display: flex; gap: 6px; min-height: 16px; }
  .lbl { color: #555; min-width: 88px; }
  .val { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; margin: 6px 0 12px; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  th, td { border: 1px solid #bbb; padding: 3px 4px; vertical-align: top; }
  th { background: #eef2f7; font-size: 9px; text-transform: uppercase; letter-spacing: 0.02em; }
  td.num, th.num { text-align: end; font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate; }
  .open { background: #f4f4f4; font-weight: 600; }
  .sector { background: #d9e4f2; font-weight: 700; }
  .subtotal { background: #eef2f7; font-weight: 600; }
  .grand { background: #1a365d; color: #fff; font-weight: 700; }
  .grand td { border-color: #1a365d; color: #fff; }
  .page-break { page-break-before: always; break-before: page; margin-top: 12px; }
  .page2 { width: 100%; margin-top: 8px; }
  .page2 th { background: #d9e4f2; font-size: 9px; text-align: center; }
  .page2 .section { background: #eef2f7; font-weight: 700; text-align: start; }
  .page2 .summary { background: #f4f7fb; font-weight: 700; }
  .end-report { margin-top: 16px; font-weight: 700; text-align: center; font-size: 11px; }
  .recap { width: 420px; margin-inline-start: auto; }
  .recap td:first-child { font-weight: 600; }
  .disclaimer { font-size: 9px; color: #333; margin-top: 12px; max-width: 90%; }
  .foot { position: running(printFoot); display: flex; justify-content: space-between; font-size: 9px; color: #444; margin-top: 16px; border-top: 1px solid #ccc; padding-top: 6px; }
  @media print {
    .foot { position: fixed; bottom: 6mm; inset-inline: 10mm; }
    body { padding-bottom: 18mm; }
  }
</style></head><body>
  <header class="sheet-head">
    <img src="${logoUrl()}" alt="QSC"/>
    <div class="titles">
      <div class="co">${escapeHtml(companyName)}</div>
      <h1>${escapeHtml(stmt.titleEn)}</h1>
      <p class="ar">${escapeHtml(stmt.titleAr)}</p>
    </div>
  </header>
  <div class="print-meta">
    <span>Print Date: ${fmtDateTime(printedAt)}</span>
    <span>Page <span class="page-num"></span></span>
  </div>
  <div class="period">${escapeHtml(periodLine)}</div>
  ${investorHtml}
  ${body}
  <footer class="foot">
    <span>User: IPMS</span>
    <span>Workstation: IPMS</span>
    <span>Printed at ${fmtDateTime(printedAt)}</span>
  </footer>
<script>
  window.onload=function(){
    try {
      var pages = Math.max(1, Math.ceil(document.body.scrollHeight / (1122 - 80)));
      var el = document.querySelector(".page-num");
      if (el) el.textContent = "1 of " + pages;
    } catch (e) {}
    window.focus();
    window.print();
  };
</script>
</body></html>`;
}

function flatLines(stmt: PortfolioStatement) {
  return stmt.sectors
    .flatMap((s) => s.lines)
    .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));
}

function stockWeightPct(line: PortfolioStatementLine, totalMv: number | null) {
  if (line.marketValue == null || !totalMv) return "";
  return formatQar((line.marketValue / totalMv) * 100);
}

function securityLabel(line: PortfolioStatementLine) {
  const code = line.compId ?? "";
  return `${code} | ${line.ticker} | ${line.companyName}`;
}

function securityAllocationBlock(stmt: PortfolioStatement) {
  const lines = flatLines(stmt);
  const totalMv = stmt.grandTotalMarketValue;
  if (lines.length === 0) return `<div class="security-alloc"><h3>Security Allocation</h3><p>—</p></div>`;
  const rows = lines.map((l) => {
    const pct = stockWeightPct(l, totalMv);
    const mv = l.marketValue == null ? "—" : num(l.marketValue);
    return `<tr><td>${escapeHtml(l.ticker)}</td><td class="num">${pct}%</td><td class="num">${mv}</td></tr>`;
  }).join("");
  return `
    <div class="security-alloc">
      <h3>Security Allocation</h3>
      <table><tbody>${rows}
        <tr><td><b>Total</b></td><td class="num">100%</td><td class="num">${num(totalMv)}</td></tr>
      </tbody></table>
    </div>`;
}

function portfolioClientRow(stmt: PortfolioStatement) {
  return `<div class="client-row">${investorBlockPortfolio(stmt.investor)}${securityAllocationBlock(stmt)}</div>`;
}

function portfolioPage2(stmt: PortfolioStatement) {
  const f = stmt.footer;
  const cash = f.clientNetCashBalance.value;
  const mv = stmt.grandTotalMarketValue;
  const portfolioValue = mv != null && cash != null ? mv + cash : null;
  const expectedTotal =
    f.expectedProfitLoss.value != null && f.currencyDifference.value != null
      ? f.expectedProfitLoss.value + f.currencyDifference.value
      : f.expectedProfitLoss.value;
  return `
    <div class="page-break"></div>
    <table class="page2">
      <thead>
        <tr>
          <th>Market Value</th><th>Expected Sell Comm.</th><th>Net (Market Value - Comm)</th>
          <th>Cash Balance</th><th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="num">${num(mv)}</td>
          <td class="num">${money(f.expectedSellCommission)}</td>
          <td class="num">${money(f.netAfterExpectedSellComm)}</td>
          <td class="num">${money(f.clientNetCashBalance)}</td>
          <td class="num">${portfolioValue == null ? "" : signedNum(portfolioValue)}</td>
        </tr>
        <tr class="section"><td colspan="5">Realized Profit/Loss</td></tr>
        <tr>
          <th>Trading P/L</th><th>Dividends Received</th><th>Dividends Receivable</th><th colspan="2">Total</th>
        </tr>
        <tr>
          <td class="num">${signedMoney(f.realizedTradingPl)}</td>
          <td class="num">${money(f.receivedProfits)}</td>
          <td class="num">${money(f.nonReceivedProfits)}</td>
          <td class="num" colspan="2">${signedMoney(f.realizedTotal)}</td>
        </tr>
        <tr class="section"><td colspan="5">Expected Profit/Loss</td></tr>
        <tr>
          <th>Trading P/L</th><th>Currency Variation</th><th>Total</th><th>Net Profit/Loss</th><th>Portfolio Value</th>
        </tr>
        <tr>
          <td class="num">${signedMoney(f.expectedProfitLoss)}</td>
          <td class="num">${money(f.currencyDifference)}</td>
          <td class="num">${expectedTotal == null ? "" : signedNum(expectedTotal)}</td>
          <td class="num summary">${signedMoney(f.netProfitLoss)}</td>
          <td class="num summary">${portfolioValue == null ? "" : signedNum(portfolioValue)}</td>
        </tr>
      </tbody>
    </table>
    <p class="end-report">End of Report</p>`;
}

function portfolioBody(stmt: PortfolioStatement) {
  const lines = flatLines(stmt);
  const totalUnrealized = lines.reduce((s, l) => s + (l.unrealizedGross ?? 0), 0);
  const tableRows = lines.map((l) => `<tr>
      <td class="num">${l.lineNo}</td>
      <td>${escapeHtml(securityLabel(l))}</td>
      <td class="num">${num(l.quantity)}</td>
      <td class="num">${num(l.costValue)}</td>
      <td class="num">${price3(l.shareCost)}</td>
      <td class="num">${money(l.breakEven)}</td>
      <td class="num">${l.priceSource === "missing_close" ? "" : price3(l.closePrice)}</td>
      <td>${fmtDate(l.closeDate)}</td>
      <td class="num">${num(l.marketValue)}</td>
      <td class="num">${stockWeightPct(l, stmt.grandTotalMarketValue)}</td>
      <td class="num">${l.unrealizedGross == null ? "" : signedNum(l.unrealizedGross)}</td>
      <td class="num">${l.profitPctGross == null ? "" : formatQar(l.profitPctGross)}</td>
      <td class="num">${num(l.currencyDifference)}</td>
    </tr>`).join("");
  return `
    ${portfolioClientRow(stmt)}
    <h3 style="margin:10px 0 4px;font-size:11px;color:#1a365d">Qatar Stock Exchange</h3>
    <table>
      <thead>
        <tr>
          <th class="num">No.</th><th>Security</th>
          <th class="num">Number of Securities</th><th class="num">Value</th><th class="num">Security Cost</th>
          <th class="num">Break Even</th><th class="num">Closing Price</th><th>Closing Date</th>
          <th class="num">Market Value</th><th class="num">Stock %</th>
          <th class="num">Unrealized Profit/Loss</th><th class="num">P/L %</th><th class="num">Currency Variation</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        <tr class="grand">
          <td colspan="3">Total — Qatari Riyal (QAR)</td>
          <td class="num">${num(stmt.grandTotalCost)}</td>
          <td colspan="4"></td>
          <td class="num">${num(stmt.grandTotalMarketValue)}</td>
          <td></td>
          <td class="num">${signedNum(totalUnrealized)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
    ${portfolioPage2(stmt)}`;
}

function accountBody(stmt: AccountStatement) {
  const rows = stmt.lines.map((l) => `<tr class="${l.isOpening ? "open" : ""}">
    <td>${fmtDate(l.postDate)}</td>
    <td>${escapeHtml(l.transType)}</td>
    <td class="num">${l.transNo ?? ""}</td>
    <td>${escapeHtml(l.description)}</td>
    <td class="num">${num(l.quantity)}</td>
    <td class="num">${money(l.securityPrice)}</td>
    <td class="num">${money(l.securityPriceWithComm)}</td>
    <td class="num">${money(l.marketFees)}</td>
    <td class="num">${money(l.commission)}</td>
    <td class="num">${num(l.debit)}</td>
    <td class="num">${num(l.credit)}</td>
    <td class="num">${num(l.balance)}</td>
    <td>${fmtDate(l.docDate)}</td>
  </tr>`);
  return `
    <table>
      <thead>
        <tr>
          <th>Post Date</th><th>Trans. Type</th><th>Trans. No.</th><th>Description</th>
          <th class="num">Quantity</th><th class="num">Security Price</th><th class="num">Price w/ comm.</th>
          <th class="num">Market Fees</th><th class="num">Commission</th>
          <th class="num">Debit</th><th class="num">Credit</th><th class="num">Balance</th><th>Doc. Date</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    <p>Unposted Dr/Cr: ${formatQar(stmt.unpostedDebit)} / ${formatQar(stmt.unpostedCredit)} · Closing ${formatQar(stmt.closingBalance)} · Transactions ${stmt.transactionCount}</p>
    <p class="disclaimer">${escapeHtml(stmt.disclaimerEn)}</p>`;
}

function summaryBody(stmt: RealizedSummaryStatement) {
  const rows = stmt.lines.map((l) => `<tr>
    <td>${escapeHtml(l.companyName)}</td>
    <td class="num">${l.compId ?? ""}</td>
    <td>${escapeHtml(l.accountTypePrinted || "")}</td>
    <td class="num">${num(l.tradingProfit)}</td>
  </tr>`);
  const recap = [
    ["Realized Profit/Loss", money(stmt.footer.realizedProfitLoss)],
  ].map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`).join("");
  return `
    <table>
      <thead>
        <tr>
          <th>Company</th><th>Code</th><th>Type</th>
          <th class="num">Trading Profit</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}
        <tr class="open"><td colspan="3">Total</td><td class="num">${num(stmt.tradingProfitTotal)}</td></tr>
      </tbody>
    </table>
    <table class="recap"><tbody>${recap}</tbody></table>`;
}

function detailsBody(stmt: RealizedDetailsStatement) {
  return stmt.stocks.map((stock) => {
    const rows = stock.lines.map((l) => `<tr class="${l.isOpening ? "open" : ""}">
      <td>${fmtDate(l.date)}</td>
      <td class="num">${l.invNo ?? ""}</td>
      <td>${escapeHtml(l.side)}</td>
      <td class="num">${num(l.buyQty)}</td>
      <td class="num">${num(l.sellQty)}</td>
      <td class="num">${num(l.shareBalance)}</td>
      <td class="num">${num(l.price)}</td>
      <td class="num">${num(l.buyValue)}</td>
      <td class="num">${num(l.sellValue)}</td>
      <td class="num">${num(l.shareCost)}</td>
      <td class="num">${num(l.grossSaleCost)}</td>
      <td class="num">${num(l.dayResult)}</td>
      <td class="num">${num(l.profitLossCumulative)}</td>
    </tr>`);
    return `
      <h2 style="font-size:12px;margin:14px 0 4px">${escapeHtml(stock.companyName)} · ${escapeHtml(stock.ticker)} · ${stock.compId ?? ""} · ${stock.currency}</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Inv No.</th><th>Side</th>
            <th class="num">Buy Qty</th><th class="num">Sell Qty</th><th class="num">Share Bal.</th>
            <th class="num">Price</th><th class="num">Buy Value</th><th class="num">Sell Value</th>
            <th class="num">Share Cost</th><th class="num">Gross Sale Cost</th>
            <th class="num">Day Result</th><th class="num">P/L</th>
          </tr>
        </thead>
        <tbody>${rows.join("")}
          <tr class="open">
            <td colspan="3">Total</td>
            <td class="num">${num(stock.totals.buyQty)}</td>
            <td class="num">${num(stock.totals.sellQty)}</td>
            <td></td><td></td>
            <td class="num">${num(stock.totals.buyValue)}</td>
            <td class="num">${num(stock.totals.sellValue)}</td>
            <td></td><td></td>
            <td class="num">${num(stock.totals.dayResult)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>`;
  }).join("");
}

export function buildStatementPrintHtml(stmt: ClientStatement): string {
  if (stmt.kind === "portfolio") {
    return printChrome(
      stmt,
      `Closing Prices as of ${fmtDate(stmt.closingPricesAsOf)}`,
      portfolioBody(stmt),
      "",
    );
  }
  if (stmt.kind === "account") {
    return printChrome(
      stmt,
      `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`,
      accountBody(stmt),
      investorBlock(stmt.investor, []),
    );
  }
  if (stmt.kind === "realized_summary") {
    const period =
      stmt.dates.mode === "range"
        ? `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`
        : `As of ${fmtDate(stmt.dates.asOf)}`;
    return printChrome(stmt, period, summaryBody(stmt), investorBlock(stmt.investor, []));
  }
  return printChrome(
    stmt,
    `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`,
    detailsBody(stmt),
    investorBlock(stmt.investor, []),
  );
}

export function openStatementPrint(stmt: ClientStatement) {
  let html: string;
  try {
    html = buildStatementPrintHtml(stmt);
  } catch (err) {
    console.error(err);
    window.alert(i18n.t("statements.printFailed"));
    return;
  }
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  // Do not pass noopener in features — Chromium then returns null and document.write throws.
  const w = window.open(url, "_blank", "width=980,height=720");
  if (!w) {
    URL.revokeObjectURL(url);
    window.alert(i18n.t("common.allowPopups"));
    return;
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
