/** Client statement JSON contracts — display only (D-005). Money math stays on the server. */

export type StatementKind = "portfolio" | "account" | "realized_summary" | "realized_details";

export type StatementDateControl =
  | { mode: "as_of"; asOf: string }
  | { mode: "range"; from: string; to: string };

export type StatementFieldSource = "sql" | "engine" | "official_close" | "missing_close" | "unknown";

export type StatementMoney = {
  value: number | null;
  source: StatementFieldSource;
  reason?: string;
};

export type StatementCompanyHeader = {
  legalName: string;
  logoPath: string;
};

export type StatementInvestorHeader = {
  nin: string;
  clientCode: string | null;
  accountId: number;
  nameAr: string;
  nameEn: string;
  displayName: string;
  currency: "QAR";
  cAccount: string | null;
  clientType: string | null;
  email: string | null;
  mobile: string | null;
  poBox: string | null;
  tel: string | null;
  fax: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tradingAccountQe: string | null;
  accountTypePrinted: string | null;
};

export type StatementPrintMeta = {
  printedAtIso: string;
  page?: { current: number; total: number } | null;
};

export type PortfolioStatementLine = {
  lineNo: number;
  companyName: string;
  ticker: string;
  compId: number | null;
  currency: "QAR";
  accountTypePrinted: string | null;
  quantity: number;
  costValue: number;
  shareCost: number;
  closePrice: number | null;
  closeDate: string | null;
  priceSource: "official_close" | "missing_close";
  marketValue: number | null;
  unrealizedGross: number | null;
  profitPctGross: number | null;
  currencyDifference: number;
  sectorCode: string | null;
  sectorName: string;
  breakEven: StatementMoney;
  displayedProfit: StatementMoney;
  displayedProfitPct: StatementMoney;
};

export type PortfolioStatementSector = {
  sectorCode: string | null;
  sectorName: string;
  weightPct: number | null;
  marketValue: number | null;
  costValue: number;
  lines: PortfolioStatementLine[];
};

export type PortfolioStatementFooter = {
  marketValue: StatementMoney;
  expectedProfitLoss: StatementMoney;
  expectedSellCommission: StatementMoney;
  netAfterExpectedSellComm: StatementMoney;
  currencyDifference: StatementMoney;
  drCrBalance: StatementMoney;
  realizedTradingPl: StatementMoney;
  receivedProfits: StatementMoney;
  nonReceivedProfits: StatementMoney;
  realizedTotal: StatementMoney;
  clientNetCashBalance: StatementMoney;
  netProfitLoss: StatementMoney;
  netAssetValue: StatementMoney;
  cashLedgerBalance: StatementMoney;
};

export type PortfolioStatement = {
  kind: "portfolio";
  titleEn: string;
  titleAr: string;
  company: StatementCompanyHeader;
  investor: StatementInvestorHeader;
  dates: { mode: "as_of"; asOf: string };
  closingPricesAsOf: string;
  sectors: PortfolioStatementSector[];
  grandTotalCost: number;
  grandTotalMarketValue: number | null;
  footer: PortfolioStatementFooter;
  missingCloses: string[];
  print: StatementPrintMeta;
};

export type AccountStatementLine = {
  postDate: string;
  docDate: string;
  transType: string;
  transNo: number | null;
  description: string;
  quantity: number | null;
  securityPrice: StatementMoney;
  securityPriceWithComm: StatementMoney;
  marketFees: StatementMoney;
  commission: StatementMoney;
  debit: number;
  credit: number;
  balance: number;
  status: string;
  isOpening: boolean;
  isUnposted: boolean;
};

export type AccountStatement = {
  kind: "account";
  titleEn: string;
  titleAr: string;
  company: StatementCompanyHeader;
  investor: StatementInvestorHeader;
  dates: { mode: "range"; from: string; to: string };
  openingBalance: number;
  openingDate: string | null;
  lines: AccountStatementLine[];
  unpostedDebit: number;
  unpostedCredit: number;
  closingBalance: number;
  transactionCount: number;
  disclaimerEn: string;
  print: StatementPrintMeta;
};

export type RealizedSummaryLine = {
  companyName: string;
  ticker: string;
  compId: number | null;
  accountTypePrinted: string | null;
  tradingProfit: number;
  distributedDividends: StatementMoney;
  nonReceivedDividends: StatementMoney;
  totalProfit: StatementMoney;
};

export type RealizedSummaryFooter = {
  commission: StatementMoney;
  endOfPeriodBalance: StatementMoney;
  drCrBalance: StatementMoney;
  paidCapital: StatementMoney;
  footerTotal: StatementMoney;
  realizedProfitLoss: StatementMoney;
  expectedProfitLoss: StatementMoney;
  netProfitLoss: StatementMoney;
  profitLossPercentage: StatementMoney;
  receivedProfits: StatementMoney;
  nonReceivedProfits: StatementMoney;
};

export type RealizedSummaryStatement = {
  kind: "realized_summary";
  titleEn: string;
  titleAr: string;
  company: StatementCompanyHeader;
  investor: StatementInvestorHeader;
  dates: StatementDateControl;
  lines: RealizedSummaryLine[];
  tradingProfitTotal: number;
  footer: RealizedSummaryFooter;
  print: StatementPrintMeta;
};

export type RealizedBlotterLine = {
  date: string;
  invNo: number | null;
  side: string;
  buyQty: number;
  sellQty: number;
  shareBalance: number;
  price: number;
  buyValue: number;
  sellValue: number;
  shareCost: number;
  grossSaleCost: number;
  dayResult: number;
  profitLossCumulative: number;
  isOpening: boolean;
};

export type RealizedDetailsStock = {
  companyName: string;
  ticker: string;
  compId: number | null;
  currency: "QAR";
  lines: RealizedBlotterLine[];
  totals: {
    buyQty: number;
    sellQty: number;
    buyValue: number;
    sellValue: number;
    dayResult: number;
  };
};

export type RealizedDetailsStatement = {
  kind: "realized_details";
  titleEn: string;
  titleAr: string;
  company: StatementCompanyHeader;
  investor: StatementInvestorHeader;
  dates: { mode: "range"; from: string; to: string };
  stocks: RealizedDetailsStock[];
  print: StatementPrintMeta;
};

export type ClientStatement =
  | PortfolioStatement
  | AccountStatement
  | RealizedSummaryStatement
  | RealizedDetailsStatement;
