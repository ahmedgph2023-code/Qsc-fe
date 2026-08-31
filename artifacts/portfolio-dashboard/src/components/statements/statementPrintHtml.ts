import i18n from "@/i18n";
import type {
  AccountStatement,
  ClientStatement,
  PortfolioStatement,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
  StatementInvestorHeader,
  StatementMoney,
} from "@/lib/statement-types";
import { formatQar } from "@/components/statements/StatementPreview";

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

function field(label: string, value: string | null | undefined) {
  return `<div class="field"><span class="lbl">${escapeHtml(label)}</span><span class="val">${escapeHtml(value || "")}</span></div>`;
}

function logoUrl() {
  const base = (typeof window !== "undefined" ? window.location.origin : "") + (import.meta.env.BASE_URL || "/");
  return `${base.replace(/\/$/, "")}/logo.png`;
}

function investorBlock(inv: StatementInvestorHeader, extra: Array<[string, string | null | undefined]>) {
  const name = inv.displayName || inv.nameAr || inv.nameEn;
  return `
    <div class="id-grid">
      ${field("Client Name", name)}
      ${field("Client No.", inv.clientCode)}
      ${field("NIN", inv.nin)}
      ${field("Account", String(inv.accountId))}
      ${field("Currency", inv.currency)}
      ${field("P.O.Box", inv.poBox)}
      ${field("Tel", inv.tel)}
      ${field("Fax", inv.fax)}
      ${field("Address", inv.address)}
      ${field("City", inv.city)}
      ${field("Country", inv.country)}
      ${field("Mobile", inv.mobile)}
      ${field("C_ACCOUNT", inv.cAccount)}
      ${field("Client type (raw)", inv.clientType)}
      ${extra.map(([l, v]) => field(l, v)).join("")}
    </div>`;
}

function printChrome(stmt: ClientStatement, periodLine: string, body: string) {
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
  .period { margin: 6px 0 10px; font-weight: 700; }
  .id-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 16px; margin-bottom: 10px; }
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
  .recap { width: 360px; margin-inline-start: auto; }
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
  <div class="period">${escapeHtml(periodLine)}</div>
  ${investorBlock(stmt.investor, [])}
  ${body}
  <footer class="foot">
    <span>IPMS</span>
    <span>${escapeHtml(stmt.investor.displayName || stmt.investor.nameEn || stmt.investor.nameAr)}</span>
    <span>Printed at ${fmtDateTime(printedAt)}</span>
  </footer>
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`;
}

function portfolioBody(stmt: PortfolioStatement) {
  const rows = stmt.sectors.flatMap((sector) => {
    const head = `<tr class="sector"><td colspan="14">${escapeHtml(sector.sectorName)}${sector.weightPct == null ? "" : ` (${formatQar(sector.weightPct)}%)`}</td></tr>`;
    const lines = sector.lines.map((l) => `<tr>
      <td>${escapeHtml(l.companyName)}</td>
      <td>${escapeHtml(l.currency)}</td>
      <td class="num">${l.compId ?? ""}</td>
      <td>${escapeHtml(l.accountTypePrinted || "")}</td>
      <td class="num">${num(l.quantity)}</td>
      <td class="num">${num(l.costValue)}</td>
      <td class="num">${num(l.shareCost)}</td>
      <td class="num">${money(l.breakEven)}</td>
      <td class="num">${l.priceSource === "missing_close" ? "" : num(l.closePrice)}</td>
      <td>${fmtDate(l.closeDate)}</td>
      <td class="num">${num(l.marketValue)}</td>
      <td class="num">${money(l.displayedProfit)}</td>
      <td class="num">${money(l.displayedProfitPct)}</td>
      <td class="num">${num(l.currencyDifference)}</td>
    </tr>`);
    return [head, ...lines];
  });
  const recap = [
    ["Market Value", num(stmt.grandTotalMarketValue)],
    ["Expected Profit/Loss", money(stmt.footer.expectedProfitLoss)],
    ["Expected Sell Comm.", money(stmt.footer.expectedSellCommission)],
    ["Net (after expected sell comm.)", money(stmt.footer.netAfterExpectedSellComm)],
    ["Currency Difference", money(stmt.footer.currencyDifference)],
    ["Dr/Cr Balance", money(stmt.footer.drCrBalance)],
    ["Realized Trading P/L", money(stmt.footer.realizedTradingPl)],
    ["Received Profits", money(stmt.footer.receivedProfits)],
    ["NonReceived Profits", money(stmt.footer.nonReceivedProfits)],
    ["Realized total", money(stmt.footer.realizedTotal)],
    ["Client Net Cash Bal.", money(stmt.footer.clientNetCashBalance)],
    ["Net Profit/Loss", money(stmt.footer.netProfitLoss)],
    ["Net Asset Value", money(stmt.footer.netAssetValue)],
  ].map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`).join("");
  return `
    <table>
      <thead>
        <tr>
          <th>Company</th><th>Curr.</th><th>Code</th><th>Type</th>
          <th class="num">Shares</th><th class="num">Shares Value</th><th class="num">Share Cost</th>
          <th class="num">Break Even</th><th class="num">Close Price</th><th>Close Date</th>
          <th class="num">Market Value</th><th class="num">Profit</th><th class="num">Profit %</th><th class="num">Curr. Diff</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    <table class="recap">
      <tbody>${recap}</tbody>
    </table>`;
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
    return printChrome(stmt, `Closing Prices as of ${fmtDate(stmt.closingPricesAsOf)}`, portfolioBody(stmt));
  }
  if (stmt.kind === "account") {
    return printChrome(stmt, `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`, accountBody(stmt));
  }
  if (stmt.kind === "realized_summary") {
    const period =
      stmt.dates.mode === "range"
        ? `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`
        : `As of ${fmtDate(stmt.dates.asOf)}`;
    return printChrome(stmt, period, summaryBody(stmt));
  }
  return printChrome(stmt, `From ${fmtDate(stmt.dates.from)} To ${fmtDate(stmt.dates.to)}`, detailsBody(stmt));
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
