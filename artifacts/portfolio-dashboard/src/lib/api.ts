import type {
  AccountStatement,
  PortfolioStatement,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
} from "./statement-types";

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE) ||
  "http://localhost:5001/api";

let authToken: string | null = localStorage.getItem("authToken");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("authToken", token);
  } else {
    localStorage.removeItem("authToken");
  }
}

export function getToken(): string | null {
  return authToken;
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.message || err.error || "Request failed");
  }
  return res.json();
}

export async function login(username: string, password: string) {
  const data = await fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export function logout() {
  setToken(null);
}

export interface UiPreferences {
  theme?: "dark" | "light" | "system";
  density?: "compact" | "default" | "comfortable";
  headerPin?: "sticky" | "flow";
  sidebarMode?: "auto" | "expanded" | "collapsed";
  palette?: string;
  accent?: string;
  showClock?: boolean;
}

export async function getCurrentUser(): Promise<{ username: string; displayName: string; role: string; userId: string; uiPreferences?: UiPreferences }> {
  return fetchApi("/auth/me");
}

export async function getUiPreferences(): Promise<UiPreferences> {
  return fetchApi("/auth/me/preferences");
}

export async function patchUiPreferences(patch: UiPreferences): Promise<UiPreferences> {
  return fetchApi("/auth/me/preferences", { method: "PATCH", body: JSON.stringify(patch) });
}

export interface StockData {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  shariahGroup?: string | null;
  isIlliquid?: boolean;
  regulatoryStatus?: string | null;
  regulatoryNotes?: string | null;
  isTradable?: boolean;
  isQeriMember?: boolean;
  isDsmMember?: boolean;
  avgDailyTradedValue?: number | string | null;
  currentPrice: number;
  dayChangePct: number;
  sparkline: number[];
  createdAt: string;
}

export function getStocks(): Promise<StockData[]> {
  return fetchApi("/stocks");
}

/** Top absolute day movers (batched server path — safe for dashboard). */
export function getStockMovers(limit = 5): Promise<StockData[]> {
  return fetchApi(`/stocks/movers?limit=${encodeURIComponent(String(limit))}`);
}

export interface CorporateAction {
  id: string;
  ticker: string;
  actionDate: string;
  actionType: "BONUS" | "STOCK_SPLIT" | "DIVIDEND";
  ratio: number | null;
  cashAmount: number | null;
  createdAt: string;
}

export interface CorporateActionPortfolioImpact {
  portfoliosAffected?: number;
  totalCashPosted?: number;
  totalQtyDelta?: number;
  reversed?: number;
  cashReversed?: number;
  applications?: Array<{
    portfolioId: string;
    qtyBefore: number;
    qtyAfter: number;
    qtyDelta: number;
    cashAmount: number;
  }>;
}

export type CorporateActionResult = CorporateAction & {
  portfolioImpact?: CorporateActionPortfolioImpact;
};

export interface AdjustedPricePoint {
  date: string;
  rawClose: number;
  adjustedClose: number;
  adjustmentFactor: number;
}

export interface TotalReturnPoint {
  date: string;
  adjustedClose: number;
  dividend: number;
  dailyReturn: number | null;
  tri: number;
}

export interface PerformanceMetricsData {
  rawClose: number;
  adjustedClose: number;
  dailyReturn: number | null;
  monthlyReturn: number | null;
  ytdReturn: number | null;
  annualReturn: number | null;
  sinceInceptionReturn: number | null;
}

export interface StockPricePoint {
  date: string;
  price: number;
  sharePrice: number | null;
  ask: number | null;
  offer: number | null;
  orderNum: number | null;
  volume: number | null;
  month: string | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  closePrice: number | null;
}

export interface StockPricesPage {
  data: StockPricePoint[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    date: string | null;
    from: string | null;
    to: string | null;
  };
}

export interface StockPriceQuery {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface StockDetailData extends StockData {
  latestPrice: number;
  priceHistory: { date: string; price: number }[];
  holdingInfo: {
    quantity: number;
    avgCost: number;
    totalCost: number;
    currentValue: number;
    gainLossValue: number;
    gainLossPct: number;
  } | null;
  corporateActions: CorporateAction[];
  adjustedPriceHistory: AdjustedPricePoint[];
  totalReturnIndex: TotalReturnPoint[];
  performanceMetrics: PerformanceMetricsData | null;
}

export function getStock(id: string, portfolioId?: string): Promise<StockDetailData> {
  const query = portfolioId ? `?portfolioId=${portfolioId}` : "";
  return fetchApi(`/stocks/${id}${query}`);
}

export function getStockPrices(id: string, query: StockPriceQuery = {}): Promise<StockPricesPage> {
  const params = new URLSearchParams();
  if (query.date) params.set("date", query.date);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return fetchApi(`/stocks/${id}/prices${qs ? `?${qs}` : ""}`);
}

export async function exportStockPrices(
  id: string,
  query: Omit<StockPriceQuery, "page" | "pageSize"> & { all?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (query.all) {
    params.set("all", "1");
  } else {
    if (query.date) params.set("date", query.date);
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
  }
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/stocks/${id}/prices/export${qs ? `?${qs}` : ""}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || "data-points.xlsx";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Corporate Actions
export function getCorporateActions(stockId: string): Promise<CorporateAction[]> {
  return fetchApi(`/stocks/${stockId}/corporate-actions`);
}

export function createCorporateAction(
  stockId: string,
  data: { actionDate: string; actionType: string; ratio?: number; cashAmount?: number }
): Promise<CorporateActionResult> {
  return fetchApi(`/stocks/${stockId}/corporate-actions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCorporateAction(
  stockId: string,
  caid: string,
  data: { actionDate: string; actionType: string; ratio?: number; cashAmount?: number }
): Promise<CorporateActionResult> {
  return fetchApi(`/stocks/${stockId}/corporate-actions/${caid}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCorporateAction(stockId: string, caid: string): Promise<{ success: boolean; portfolioImpact?: CorporateActionPortfolioImpact }> {
  return fetchApi(`/stocks/${stockId}/corporate-actions/${caid}`, { method: "DELETE" });
}

// Adjusted Prices
export function getAdjustedPrices(stockId: string): Promise<AdjustedPricePoint[]> {
  return fetchApi(`/stocks/${stockId}/adjusted-prices`);
}

// Total Return
export function getTotalReturn(stockId: string): Promise<TotalReturnPoint[]> {
  return fetchApi(`/stocks/${stockId}/total-return`);
}

// Performance Metrics
export function getPerformanceMetrics(stockId: string): Promise<PerformanceMetricsData> {
  return fetchApi(`/stocks/${stockId}/performance-metrics`);
}

export function uploadStockPrices(stockId: string, file: File): Promise<{ count: number }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi(`/stocks/${stockId}/upload`, {
    method: "POST",
    body: formData,
  });
}

export interface UploadConflictRow<T extends Record<string, unknown> = Record<string, unknown>> {
  date: string;
  current: T;
  incoming: T;
}

export interface StockUploadPreview {
  kind: "stock";
  ticker: string;
  total: number;
  newCount: number;
  conflictCount: number;
  newRows: { date: string; price: number; closePrice?: number }[];
  conflicts: UploadConflictRow<{ date: string; price: number; closePrice?: number }>[];
}

export type IndexDataPointInput = {
  date: string;
  value: number;
  openValue?: number | null;
  highValue?: number | null;
  lowValue?: number | null;
};

export interface IndexDataPoint {
  id: string;
  indexId: string;
  date: string;
  value: number;
  openValue: number | null;
  highValue: number | null;
  lowValue: number | null;
}

export interface IndexUploadPreview {
  kind: "index";
  name: string;
  total: number;
  newCount: number;
  conflictCount: number;
  newRows: IndexDataPointInput[];
  conflicts: UploadConflictRow<IndexDataPointInput>[];
}

export function previewStockPriceUpload(stockId: string, file: File): Promise<StockUploadPreview> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi(`/stocks/${stockId}/upload/preview`, { method: "POST", body: formData });
}

export function commitStockPriceUpload(
  stockId: string,
  data: {
    newRows: { date: string; price: number }[];
    overwriteRows: { date: string; price: number }[];
  }
): Promise<{ count: number; inserted: number; overwritten: number }> {
  return fetchApi(`/stocks/${stockId}/upload/commit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type StockPriceInput = {
  date: string;
  price: number;
  openPrice?: number | null;
  highPrice?: number | null;
  lowPrice?: number | null;
  closePrice?: number | null;
  volume?: number | null;
  sharePrice?: number | null;
  ask?: number | null;
  offer?: number | null;
  orderNum?: number | null;
  month?: string | null;
};

export function createStockPrice(stockId: string, data: StockPriceInput) {
  return fetchApi(`/stocks/${stockId}/prices`, { method: "POST", body: JSON.stringify(data) });
}

export function updateStockPrice(stockId: string, date: string, data: Omit<StockPriceInput, "date">) {
  return fetchApi(`/stocks/${stockId}/prices/${date}`, { method: "PUT", body: JSON.stringify({ ...data, date }) });
}

export function deleteStockPrice(stockId: string, date: string) {
  return fetchApi(`/stocks/${stockId}/prices/${date}`, { method: "DELETE" });
}

export function createStock(data: {
  ticker: string;
  companyName: string;
  sector: string;
  shariahGroup?: string;
  regulatoryStatus?: string;
  avgDailyTradedValue?: number;
  isTradable?: boolean;
}) {
  return fetchApi("/stocks", { method: "POST", body: JSON.stringify(data) });
}

export function deleteStock(id: string) {
  return fetchApi(`/stocks/${id}`, { method: "DELETE" });
}

export type ClientType = "individual" | "company";
export type Gender = "male" | "female";

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  portfolioId: string;
  totalInvested: number;
  currentValue: number;
  returnPct: number;
  clientType?: ClientType;
  title?: string | null;
  gender?: Gender | null;
  birthdate?: string | null;
  nationality?: string | null;
  mobileNumber?: string | null;
  city?: string | null;
  country?: string | null;
  idNumber?: string | null;
  idValidity?: string | null;
  accountNumber?: string | null;
  notes?: string | null;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  joinDate?: string;
  clientType?: ClientType;
  title?: string | null;
  gender?: Gender | null;
  birthdate?: string | null;
  nationality?: string | null;
  mobileNumber?: string | null;
  city?: string | null;
  country?: string | null;
  idNumber?: string | null;
  idValidity?: string | null;
  accountNumber?: string | null;
  notes?: string | null;
}

export function getCustomers(): Promise<CustomerData[]> {
  return fetchApi("/customers");
}

export function getCustomer(id: string, asOf?: string, identityOnly = false): Promise<CustomerData> {
  const params = new URLSearchParams();
  if (asOf) params.set("asOf", asOf);
  if (identityOnly) params.set("identity", "1");
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/customers/${id}${q}`);
}

export function createCustomer(data: CreateCustomerInput): Promise<CustomerData & { portfolioId: string }> {
  return fetchApi("/customers", { method: "POST", body: JSON.stringify(data) });
}

export function updateCustomer(id: string, data: Partial<CreateCustomerInput>): Promise<CustomerData> {
  return fetchApi(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteCustomer(id: string) {
  return fetchApi(`/customers/${id}`, { method: "DELETE" });
}

export type ExtClientListRow = {
  id: string;
  clientId: number;
  nin: string;
  mainObjCode: string | null;
  accountNumber: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  shareCount: number;
  cashCount: number;
  firstShare: string | null;
  lastShare: string | null;
  cashBalance: number;
  navValue: number | null;
  totalInvested: number | null;
  returnPct: number | null;
};

export type ExtShareLedgerRow = {
  id: string;
  date: string;
  ticker: string;
  companyName: string;
  invType: string;
  buySellFlag: string;
  side: string;
  quantity: number;
  avgPrice: number;
  total: number;
  net: number;
  totalComm: number;
  officeComm?: number;
  marketComm?: number;
  originalPrice?: number;
  unitPrice: number;
  invNo: number | null;
  compId?: number | null;
};

export type ExtCashLedgerRow = {
  id: number;
  docCode: string;
  docNo: number | null;
  serNo: number | null;
  nin: string;
  mainObjCode: string | null;
  objCode: number;
  dbAmt: number;
  crAmt: number;
  remarks: string | null;
  eRemarks: string | null;
  docDate: string;
  postDate: string;
  docAmt: number;
  status: string;
  balanceAfter: number;
};

export type ExtClientDetail = {
  clientId: number;
  nin: string;
  mainObjCode: string | null;
  accountNumber: string;
  name: string;
  nameEn?: string;
  nameAr?: string;
  cAccount?: string | null;
  clientType?: string | null;
  email?: string | null;
  mobile?: string | null;
  asOf: string;
  cashBalance: number;
  equityMv: number;
  navValue: number;
  totalInvested: number;
  currentValue: number;
  returnPct: number | null;
  unrealizedPnL: number;
  realizedPnL: number;
  holdings: Holding[];
  allocation?: PortfolioData["allocation"];
  excelWorkbook?: PortfolioData["excelWorkbook"];
  dailyChanges?: PortfolioData["dailyChanges"];
};

export function extClientDisplayName(
  row: Pick<ExtClientListRow, "name" | "nameEn" | "nameAr"> | Pick<ExtClientDetail, "name" | "nameEn" | "nameAr">,
  locale?: string,
): string {
  const ar = (row.nameAr || "").trim();
  const en = (row.nameEn || "").trim();
  const fallback = (row.name || "").trim();
  if ((locale || "").startsWith("ar")) return ar || en || fallback;
  return en || ar || fallback;
}

export function getExtClients(asOf?: string): Promise<ExtClientListRow[]> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/ext/clients${q}`);
}

export function getExtClient(id: string, asOf?: string): Promise<ExtClientDetail> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}${q}`);
}

export type ExtLedgerPage<T> = {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type ExtCashLedgerPage = ExtLedgerPage<ExtCashLedgerRow> & { balance: number };

function ledgerQuery(
  asOf: string | undefined,
  page: number,
  pageSize: number,
  extra?: Record<string, string | undefined>,
) {
  const q = new URLSearchParams();
  if (asOf) q.set("asOf", asOf);
  q.set("page", String(page));
  q.set("pageSize", String(pageSize));
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) q.set(key, value);
    }
  }
  return `?${q.toString()}`;
}

export function getExtClientShares(
  id: string,
  asOf?: string,
  page = 1,
  pageSize = 10,
  extra?: { q?: string; side?: string; invType?: string },
): Promise<ExtLedgerPage<ExtShareLedgerRow>> {
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/shares${ledgerQuery(asOf, page, pageSize, extra)}`);
}

export function getExtClientCash(
  id: string,
  asOf?: string,
  page = 1,
  pageSize = 10,
  extra?: { q?: string; status?: string; from?: string },
): Promise<ExtCashLedgerPage> {
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/cash${ledgerQuery(asOf, page, pageSize, extra)}`);
}

export type {
  AccountStatement,
  ClientStatement,
  PortfolioStatement,
  RealizedDetailsStatement,
  RealizedSummaryStatement,
  StatementMoney,
} from "./statement-types";

function statementRangeQuery(from: string, to: string) {
  const q = new URLSearchParams();
  q.set("from", from);
  q.set("to", to);
  return `?${q.toString()}`;
}

export function getPortfolioStatement(id: string, asOf?: string): Promise<PortfolioStatement> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/statements/portfolio${q}`);
}

export function getAccountStatement(id: string, from: string, to: string): Promise<AccountStatement> {
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/statements/account${statementRangeQuery(from, to)}`);
}

export function getRealizedSummaryStatement(id: string, from: string, to: string): Promise<RealizedSummaryStatement> {
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/statements/realized-summary${statementRangeQuery(from, to)}`);
}

export function getRealizedDetailsStatement(id: string, from: string, to: string): Promise<RealizedDetailsStatement> {
  return fetchApi(`/ext/clients/${encodeURIComponent(id)}/statements/realized-details${statementRangeQuery(from, to)}`);
}

const STATEMENT_XLSX: Record<string, string> = {
  portfolio: "portfolio.xlsx",
  account: "account.xlsx",
  realized_summary: "realized-summary.xlsx",
  realized_details: "realized-details.xlsx",
};

export async function downloadStatementExcel(
  id: string,
  kind: "portfolio" | "account" | "realized_summary" | "realized_details",
  dates: { asOf?: string; from?: string; to?: string },
) {
  const q = new URLSearchParams();
  if (kind === "portfolio") {
    if (dates.asOf) q.set("asOf", dates.asOf);
  } else {
    if (dates.from) q.set("from", dates.from);
    if (dates.to) q.set("to", dates.to);
  }
  const qs = q.toString();
  const res = await fetch(
    `${API_BASE}/ext/clients/${encodeURIComponent(id)}/statements/${STATEMENT_XLSX[kind]}${qs ? `?${qs}` : ""}`,
    { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Export failed" }));
    throw new Error(err.message || err.error || "Export failed");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || "statement.xlsx";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type SnapshotMatchStatus = "matched" | "cash_only" | "mismatch" | "incomplete" | "qsc_missing";

export type SnapshotCompareRow = {
  id: string;
  clientId: number;
  snapshotDate: string;
  nin: string | null;
  name: string | null;
  ipmsMarketValue: number | null;
  ipmsCash: number;
  ipmsNavMvPlusCash: number | null;
  missingCloses: string[];
  qscPortfolioValue: number | null;
  qscSystemCash: number | null;
  qscBankBalance: number | null;
  qscUpdatedAt: string | null;
  cashMatch: boolean | null;
  mvMatch: boolean | null;
  navMatch: boolean | null;
  bankMatch: null;
  status: SnapshotMatchStatus;
  cashDelta: number | null;
  mvDelta: number | null;
  navDelta: number | null;
};

export type SnapshotCompareList = {
  asOf: string;
  latestQscDate: string | null;
  qscDates: Array<{ date: string; rows: number; lastUpdated?: string | null }>;
  storedDates: string[];
  maxOfficialCloseDate: string | null;
  rows: SnapshotCompareRow[];
  summary: Record<SnapshotMatchStatus | "total", number>;
};

export function getSnapshots(asOf?: string): Promise<SnapshotCompareList> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/snapshots${q}`);
}

export function runSnapshots(asOf?: string): Promise<SnapshotCompareList & { qscRowCount: number; stored: number }> {
  return fetchApi("/snapshots/run", {
    method: "POST",
    body: JSON.stringify(asOf ? { asOf } : {}),
  });
}

export type LiveBroadcastStatus = {
  configured: boolean;
  connected: false;
  ingestOfficialCloses: false;
  valuationSource: "official_close";
  objectsNamedByQsc: string[];
  blockedReason: "NO_BROADCAST_WS_URL" | "NO_JSON_SAMPLE";
};

export function getLiveStatus(): Promise<LiveBroadcastStatus> {
  return fetchApi("/live/status");
}

export type ProductDecisionRow = {
  id: string;
  handoverQuestion: number | null;
  codeToday: string;
  status: "blocked";
};

export type ProductDecisionBoard = {
  signed: false;
  rows: ProductDecisionRow[];
};

export function getProductDecisions(): Promise<ProductDecisionBoard> {
  return fetchApi("/product-decisions");
}

export type StatementQuestionBoard = {
  signed: false;
  fillFooter: false;
  changeNiEngine: false;
  rows: ProductDecisionRow[];
};

export function getStatementQuestions(): Promise<StatementQuestionBoard> {
  return fetchApi("/statement-questions");
}

export type UatBoard = {
  runnable: false;
  phase1Accepted: false;
  gapAnalysisIsNotStatus: true;
  laterPhaseRoutesLocked: true;
  rows: ProductDecisionRow[];
};

export function getUatStatus(): Promise<UatBoard> {
  return fetchApi("/uat/status");
}

export type BalanceQuestionBoard = {
  signed: false;
  inventBankLedger: false;
  addAccountantRole: false;
  rows: ProductDecisionRow[];
};

export function getBalanceQuestions(): Promise<BalanceQuestionBoard> {
  return fetchApi("/balance-questions");
}

export interface Holding {
  stockId: string;
  ticker: string;
  companyName: string;
  sector: string;
  quantity: number;
  totalCost: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  gainLossValue: number;
  gainLossPct: number;
  openedOn?: string | null;
  holdingDays?: number | null;
  excelAnnualizedPct?: number | null;
  excelContributionPct?: number | null;
  excelWeight?: number | null;
  compId?: number | null;
}

export interface MonthReturn {
  year: number;
  month: number;
  startValue: number;
  endValue: number;
  cashFlow: number;
  returnPct: number;
  weightDays: number;
}

export interface PortfolioData {
  id: string;
  customerId: string;
  name: string;
  benchmarkIndexId: string | null;
  customer: any;
  benchmarkIndex: any;
  totalInvested: number;
  currentValue: number;
  returnPct: number;
  cashBalance?: number;
  navValue?: number;
  holdings: Holding[];
  allocation?: {
    cash?: { value: number; weight: number };
    sectors?: { sector: string; value: number; weight: number }[];
  };
  excelWorkbook?: {
    equityValue: number;
    totalCost: number;
    gain: number;
    growth: number | null;
    growthPct: number | null;
    indexPerformancePct?: number | null;
    indexName?: string | null;
    indexFromDate?: string | null;
    indexToDate?: string | null;
  };
  dailyChanges?: { date: string; nav: number; chgQar: number | null; chgPct: number | null }[];
  twar: number;
  monthlyReturns: MonthReturn[];
  simpleMonthlyReturns?: { year: number; month: number; simpleReturnPct: number }[];
  indexMonthlyReturns?: { year: number; month: number; returnPct: number }[] | null;
  performance: {
    portfolioSeries: { date: string; value: number; normalized: number }[];
    indexSeries: { date: string; value: number; normalized: number }[];
  } | null;
  valueHistory: { date: string; value: number }[];
}

export function getPortfolio(id: string, asOf?: string): Promise<PortfolioData> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/portfolios/${id}${q}`);
}

export function getPortfolioHoldings(portfolioId: string): Promise<Holding[]> {
  return fetchApi(`/portfolios/${portfolioId}/holdings`);
}

export function setPortfolioBenchmark(portfolioId: string, benchmarkIndexId: string | null) {
  return fetchApi(`/portfolios/${portfolioId}/benchmark`, {
    method: "PUT",
    body: JSON.stringify({ benchmarkIndexId }),
  });
}

export interface TransactionData {
  id: string;
  portfolioId: string;
  stockId: string;
  type: "BUY" | "SELL" | "CLIENT_TRANSFER";
  quantity: string | number;
  price: string | number;
  timestamp: string;
  createdAt: string;
  cashBalanceAfter?: number | string | null;
  tradeAmount?: number;
  priceSourceDate?: string | null;
  stock: { ticker: string; companyName: string } | null;
}

export function getTransactions(portfolioId: string, stockId?: string, asOf?: string): Promise<TransactionData[]> {
  const params = new URLSearchParams();
  if (stockId) params.set("stockId", stockId);
  if (asOf) params.set("asOf", asOf);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi(`/transactions/portfolio/${portfolioId}${query}`);
}

export function createTransaction(portfolioId: string, data: {
  stockId: string;
  type: "BUY" | "SELL" | "CLIENT_TRANSFER";
  quantity: number;
  price?: number | null;
  timestamp?: string;
  useClosingPrice?: boolean;
}): Promise<TransactionData> {
  return fetchApi(`/transactions/portfolio/${portfolioId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getClosingPrice(stockId: string, date: string): Promise<{
  date: string;
  price: number;
  close: number;
  open: number | null;
  high: number | null;
  low: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  sourceDate: string;
}> {
  return fetchApi(`/transactions/closing-price/${stockId}?date=${encodeURIComponent(date)}`);
}

export function checkTradeEligibility(
  portfolioId: string,
  stockId: string,
  type: "BUY" | "SELL" = "BUY",
): Promise<{
  allowed: boolean;
  type: string;
  reasons: string[];
  warnings: string[];
  message: string;
  mandate: {
    id: string;
    shariahPreference: string;
    riskProfile: string;
    approvalStatus: string;
  } | null;
}> {
  return fetchApi(
    `/transactions/portfolio/${portfolioId}/eligibility?stockId=${encodeURIComponent(stockId)}&type=${type}`,
  );
}

export function deleteTransaction(id: string) {
  return fetchApi(`/transactions/${id}`, { method: "DELETE" });
}

export function bulkDeleteTransactions(portfolioId: string, ids: string[]) {
  return fetchApi(`/transactions/portfolio/${portfolioId}/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  }) as Promise<{ count: number; deleted: string[]; errors: string[]; skipped: number }>;
}

export interface DashboardMetrics {
  totalAum: number;
  activeClients: number;
  avgPortfolioSize: number;
  dailyPnL: number;
  dailyPnLPct: number;
}

export function getDashboardMetrics(): Promise<DashboardMetrics> {
  return fetchApi("/dashboard/metrics");
}

export function getAumTrajectory(): Promise<{ date: string; value: number }[]> {
  return fetchApi("/dashboard/aum-trajectory");
}

export type SqlFirmOverview = {
  source: "sql";
  configured: boolean;
  asOf: string | null;
  qscDates: Array<{ date: string; rows: number; lastUpdated?: string | null }>;
  metrics: {
    totalPortfolioValue: number;
    totalSystemCash: number;
    totalNavDisplay: number;
    activeClients: number;
    avgPortfolioSize: number;
    clientsWithShares: number;
    clientsCashOnly: number;
    ledgerClients: number;
    shareTxRows: number;
    cashTxRows: number;
    pvDelta: number | null;
    pvDeltaPct: number | null;
    cashDelta: number | null;
  };
  trajectory: Array<{ date: string; portfolioValue: number; systemCash: number; navDisplay: number }>;
  topClients: Array<{
    clientId: number;
    name: string;
    nameEn: string;
    nameAr: string;
    portfolioValue: number;
    systemCash: number;
  }>;
  mix: { equity: number; cash: number };
  indices: {
    dsm: {
      id: string;
      name: string;
      last: number;
      changePct: number | null;
      series: Array<{ date: string; value: number }>;
    } | null;
    qeri: {
      id: string;
      name: string;
      last: number;
      changePct: number | null;
      series: Array<{ date: string; value: number }>;
    } | null;
  };
};

export function getSqlFirmOverview(asOf?: string): Promise<SqlFirmOverview> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/dashboard/sql-overview${q}`);
}

export function getAumVsIndex(indexName?: string): Promise<{
  portfolioSeries: { date: string; value: number; normalized: number }[];
  indexSeries: { date: string; value: number; normalized: number }[];
}> {
  const query = indexName ? `?index=${encodeURIComponent(indexName)}` : "";
  return fetchApi(`/dashboard/aum-vs-index${query}`);
}

export interface SectorRecommendation {
  id: string;
  name: string;
  description: string | null;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "REDUCE" | "EXIT";
  signal?: string;
  sector?: string;
  score: number;
  confidence: number;
  sentimentScore: number;
  totalArticles: number;
  positiveArticles: number;
  neutralArticles: number;
  negativeArticles: number;
  positiveDrivers: string[];
  topRisks: string[];
  explanation: string | null;
  lastUpdated: string;
}

export function getSectors(): Promise<SectorRecommendation[]> {
  return fetchApi("/sectors");
}

export function fetchSectorNews(): Promise<{ message: string; count: number }> {
  return fetchApi("/sectors/fetch-news", { method: "POST" });
}

export function analyzeSectorArticles(): Promise<{ message: string; analyzed: number; total: number }> {
  return fetchApi("/sectors/analyze", { method: "POST" });
}

export function recalculateSectorScores(): Promise<{ message: string }> {
  return fetchApi("/sectors/recalculate", { method: "POST" });
}

export function fullSectorRefresh(): Promise<{ message: string; articlesFetched: number; articlesAnalyzed: number }> {
  return fetchApi("/sectors/full-refresh", { method: "POST" });
}

export interface SectorDetail extends SectorRecommendation {
  articles: SectorNewsArticle[];
}

export interface SectorNewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  impact: "LOW" | "MEDIUM" | "HIGH" | null;
  confidence: number | null;
  summary: string | null;
  keyDrivers: string[];
  risks: string[];
}

export function getSectorDetail(sectorId: string): Promise<SectorDetail> {
  return fetchApi(`/sectors/${sectorId}`);
}

export interface SectorNewsFilter {
  sentiment?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function getSectorNews(sectorId: string, filter?: SectorNewsFilter): Promise<SectorNewsArticle[]> {
  const params = new URLSearchParams();
  if (filter?.sentiment) params.set("sentiment", filter.sentiment);
  if (filter?.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter?.dateTo) params.set("dateTo", filter.dateTo);
  const qs = params.toString();
  return fetchApi(`/sectors/${sectorId}/news${qs ? `?${qs}` : ""}`);
}

export interface IndexData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  currentValue: number;
  dayChangePct: number;
  sparkline: number[];
}

export function getIndices(): Promise<IndexData[]> {
  return fetchApi("/indices");
}

export function getIndex(id: string): Promise<IndexData & { dataPoints: IndexDataPoint[] }> {
  return fetchApi(`/indices/${id}`);
}

export interface IndexDataPointsPage {
  data: IndexDataPoint[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    date: string | null;
    from: string | null;
    to: string | null;
  };
}

export interface IndexDataPointQuery {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function getIndexDataPoints(id: string, query: IndexDataPointQuery = {}): Promise<IndexDataPointsPage> {
  const params = new URLSearchParams();
  if (query.date) params.set("date", query.date);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return fetchApi(`/indices/${id}/data-points${qs ? `?${qs}` : ""}`);
}

export async function exportIndexDataPoints(
  id: string,
  query: Omit<IndexDataPointQuery, "page" | "pageSize"> & { all?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (query.all) {
    params.set("all", "1");
  } else {
    if (query.date) params.set("date", query.date);
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
  }
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/indices/${id}/data-points/export${qs ? `?${qs}` : ""}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || "index-data-points.xlsx";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function createIndex(data: { name: string; description?: string }): Promise<IndexData> {
  return fetchApi("/indices", { method: "POST", body: JSON.stringify(data) });
}

export function deleteIndex(id: string) {
  return fetchApi(`/indices/${id}`, { method: "DELETE" });
}

export function uploadIndexData(indexId: string, file: File): Promise<{ count: number }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi(`/indices/${indexId}/upload`, {
    method: "POST",
    body: formData,
  });
}

export function previewIndexDataUpload(indexId: string, file: File): Promise<IndexUploadPreview> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi(`/indices/${indexId}/upload/preview`, { method: "POST", body: formData });
}

export function commitIndexDataUpload(
  indexId: string,
  data: {
    newRows: IndexDataPointInput[];
    overwriteRows: IndexDataPointInput[];
  }
): Promise<{ count: number; inserted: number; overwritten: number }> {
  return fetchApi(`/indices/${indexId}/upload/commit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createIndexDataPoint(indexId: string, data: IndexDataPointInput) {
  return fetchApi(`/indices/${indexId}/data-points`, { method: "POST", body: JSON.stringify(data) });
}

export function updateIndexDataPoint(indexId: string, date: string, data: Omit<IndexDataPointInput, "date">) {
  return fetchApi(`/indices/${indexId}/data-points/${date}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteIndexDataPoint(indexId: string, date: string) {
  return fetchApi(`/indices/${indexId}/data-points/${date}`, { method: "DELETE" });
}

export async function downloadStockTemplate() {
  const res = await fetch(`${API_BASE}/stocks/template/download`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "stock-price-template.xlsx"; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadIndexTemplate() {
  const res = await fetch(`${API_BASE}/indices/template/download`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "index-data-template.xlsx"; a.click();
  URL.revokeObjectURL(url);
}

export async function downloadTransactionTemplate() {
  const res = await fetch(`${API_BASE}/transactions/template/download`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "transaction-template.xlsx"; a.click();
  URL.revokeObjectURL(url);
}

export function bulkUploadTransactions(
  portfolioId: string,
  file: File,
  opts?: { bypassHighLow?: boolean },
): Promise<{
  count: number;
  inserted: string[];
  errors: string[];
  skippedRemaining?: number;
  stoppedAt?: string | null;
  bypassHighLow?: boolean;
  corporateActionsApplied?: { ticker: string; actionType: string; actionDate: string; cashCredited: number; qtyDelta: number }[];
}> {
  const formData = new FormData();
  formData.append("file", file);
  if (opts?.bypassHighLow) formData.append("bypassHighLow", "true");
  return fetchApi(`/transactions/portfolio/${portfolioId}/bulk`, {
    method: "POST",
    body: formData,
  });
}

export async function downloadBulkStockTemplate() {
  const res = await fetch(`${API_BASE}/stocks/bulk-template/download`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "stock-master-upload.xlsx"; a.click();
  URL.revokeObjectURL(url);
}

export function bulkUploadStocks(file: File): Promise<{ count: number; stocksCreated: number; stocksFound: number; tickers: string[] }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi("/stocks/bulk-upload", {
    method: "POST",
    body: formData,
  });
}

// Phase 1 IPMS
export type ApiRecord = Record<string, any>;
export type MandateStatus = "pending" | "approved" | "amended" | "closed" | "rejected";

export interface Mandate extends ApiRecord {
  id: string;
  customerId: string;
  shariahPreference: "fully_shariah" | "unrestricted";
  riskProfile: "medium" | "high";
  approvalStatus: MandateStatus;
  contractStart?: string | null;
  contractEnd?: string | null;
  initialValue?: number | string | null;
  restrictions: ApiRecord[];
  history: ApiRecord[];
}

export interface PortfolioManagerRow {
  portfolioId: string;
  customerId: string;
  customerName: string;
  accountNumber: string | null;
  nav: number;
  cash: number;
  invested: number;
  returnPct: number;
  shariahPreference: string | null;
  riskProfile: string | null;
  mandateStatus: MandateStatus | "missing";
  openRiskAlerts: number;
  openComplianceExceptions: number;
  pendingRebalance: boolean;
}

const queryString = (params?: Record<string, string | number | boolean | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const getMandate = (customerId: string): Promise<Mandate> =>
  fetchApi(`/mandates/customer/${customerId}`);
export const saveMandate = (customerId: string, data: ApiRecord): Promise<Mandate> =>
  fetchApi(`/mandates/customer/${customerId}`, { method: "PUT", body: JSON.stringify(data) });
export const approveMandate = (customerId: string): Promise<Mandate> =>
  fetchApi(`/mandates/customer/${customerId}/approve`, { method: "POST", body: JSON.stringify({}) });
export const rejectMandate = (customerId: string, reason: string): Promise<Mandate> =>
  fetchApi(`/mandates/customer/${customerId}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
export const closeMandate = (customerId: string, reason: string): Promise<Mandate> =>
  fetchApi(`/mandates/customer/${customerId}/close`, { method: "POST", body: JSON.stringify({ reason }) });
export const addMandateRestriction = (customerId: string, data: ApiRecord) =>
  fetchApi(`/mandates/customer/${customerId}/restrictions`, { method: "POST", body: JSON.stringify(data) });
export const deleteMandateRestriction = (id: string) =>
  fetchApi(`/mandates/restrictions/${id}`, { method: "DELETE" });

export const getPortfolioManager = (filters?: Record<string, string>): Promise<PortfolioManagerRow[]> =>
  fetchApi(`/portfolios/manager${queryString(filters)}`);
export const getPhase1Portfolio = (id: string, asOf?: string): Promise<ApiRecord> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/portfolios/${id}/phase1${q}`);
};
export const getPortfolioCash = (id: string, asOf?: string): Promise<ApiRecord> => {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  return fetchApi(`/portfolios/${id}/cash${q}`);
};
export const addPortfolioCash = (id: string, data: ApiRecord): Promise<ApiRecord> =>
  fetchApi(`/portfolios/${id}/cash`, { method: "POST", body: JSON.stringify(data) });

export const deletePortfolioCash = (portfolioId: string, cashId: string) =>
  fetchApi(`/portfolios/${portfolioId}/cash/${cashId}`, { method: "DELETE" });

export const bulkDeletePortfolioCash = (portfolioId: string, ids: string[]) =>
  fetchApi(`/portfolios/${portfolioId}/cash/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({ ids }),
  }) as Promise<{ count: number; deleted: string[]; errors: string[]; balance?: number }>;

export const getBuilderModels = (): Promise<ApiRecord[]> => fetchApi("/builder/models");
export const saveModelHoldings = (modelId: string, holdings: ApiRecord[]): Promise<ApiRecord> =>
  fetchApi(`/builder/models/${modelId}/holdings`, { method: "PUT", body: JSON.stringify({ holdings }) });
export const getIndexReference = (index: "QERI" | "DSM"): Promise<ApiRecord> =>
  fetchApi(`/builder/index-reference?index=${index}`);

export interface IndexConstituentRow {
  stockId: string;
  ticker: string | null;
  companyName: string | null;
  sector: string | null;
  weight: number;
  weightPct: number;
}

export interface IndexConstituentSnapshot {
  effectiveDate: string;
  constituents: IndexConstituentRow[];
  totalWeight: number;
  totalWeightPct: number;
}

export const getIndexConstituentsHistory = (indexId: string): Promise<{ snapshots: IndexConstituentSnapshot[] }> =>
  fetchApi(`/builder/indices/${indexId}/constituents`);

export const setIndexConstituents = (indexId: string, data: { effectiveDate: string; constituents: { stockId: string; weight: number }[] }) =>
  fetchApi(`/builder/indices/${indexId}/constituents`, { method: "PUT", body: JSON.stringify(data) });

export const deleteIndexConstituentsSnapshot = (indexId: string, effectiveDate: string) =>
  fetchApi(`/builder/indices/${indexId}/constituents?effectiveDate=${encodeURIComponent(effectiveDate)}`, {
    method: "DELETE",
  });
export const createBuilderSession = (data: ApiRecord): Promise<ApiRecord> =>
  fetchApi("/builder/sessions", { method: "POST", body: JSON.stringify(data) });
export const getBuilderSession = (id: string): Promise<ApiRecord> => fetchApi(`/builder/sessions/${id}`);
export const updateBuilderSession = (id: string, data: ApiRecord): Promise<ApiRecord> =>
  fetchApi(`/builder/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const reviewBuilderSession = (id: string): Promise<ApiRecord> =>
  fetchApi(`/builder/sessions/${id}/review`, { method: "POST" });
export const proposeBuilderTrades = (id: string): Promise<ApiRecord> =>
  fetchApi(`/builder/sessions/${id}/propose-trades`, { method: "POST" });
export const convertBuilderSession = (id: string, data: ApiRecord = {}): Promise<ApiRecord> =>
  fetchApi(`/builder/sessions/${id}/convert`, { method: "POST", body: JSON.stringify(data) });

export const getRebalances = (filters?: Record<string, string>): Promise<ApiRecord[]> =>
  fetchApi(`/rebalances${queryString(filters)}`);
export const getRebalance = (id: string): Promise<ApiRecord> => fetchApi(`/rebalances/${id}`);
export const transitionRebalance = (id: string, action: "approve" | "execute" | "finalize" | "cancel", reason?: string) =>
  fetchApi(`/rebalances/${id}/${action}`, { method: "POST", body: JSON.stringify({ reason }) });
export const createRebalanceCorrection = (id: string, data: ApiRecord): Promise<ApiRecord> =>
  fetchApi(`/rebalances/${id}/corrections`, { method: "POST", body: JSON.stringify(data) });

export const runCompliance = (data: ApiRecord): Promise<ApiRecord> =>
  fetchApi("/compliance/run", { method: "POST", body: JSON.stringify(data) });
export const getComplianceResults = (portfolioId?: string): Promise<ApiRecord[]> =>
  fetchApi(`/compliance/results${queryString({ portfolioId })}`);
export const getComplianceExceptions = (status?: string): Promise<ApiRecord[]> =>
  fetchApi(`/compliance/exceptions${queryString({ status })}`);
export const createComplianceException = (data: ApiRecord): Promise<ApiRecord> =>
  fetchApi("/compliance/exceptions", { method: "POST", body: JSON.stringify(data) });
export const decideComplianceException = (id: string, decision: "approve" | "reject", reason?: string): Promise<ApiRecord> =>
  fetchApi(`/compliance/exceptions/${id}/${decision}`, { method: "POST", body: JSON.stringify({ reason }) });

export const getRiskAlerts = (filters?: Record<string, string>): Promise<ApiRecord[]> =>
  fetchApi(`/risk/alerts${queryString(filters)}`);
export const scanRisk = (portfolioId?: string): Promise<ApiRecord> =>
  fetchApi("/risk/scan", { method: "POST", body: JSON.stringify({ portfolioId }) });
export const resolveRiskAlert = (id: string, notes: string): Promise<ApiRecord> =>
  fetchApi(`/risk/alerts/${id}/resolve`, { method: "POST", body: JSON.stringify({ notes }) });
export const waiveRiskAlert = (id: string, reason: string): Promise<ApiRecord> =>
  fetchApi(`/risk/alerts/${id}/waive`, { method: "POST", body: JSON.stringify({ reason }) });
export const assignRiskAlert = (id: string, ownerId?: string | null): Promise<ApiRecord> =>
  fetchApi(`/risk/alerts/${id}/assign`, { method: "POST", body: JSON.stringify({ ownerId }) });
export const getRiskConfig = (): Promise<ApiRecord[]> => fetchApi("/risk/config");

export const getAuditLogs = (filters?: Record<string, string>): Promise<ApiRecord[]> =>
  fetchApi(`/audit${queryString(filters)}`);
export const getAuditHealth = (): Promise<ApiRecord> => fetchApi("/audit/health");

export const getFiInstruments = (): Promise<ApiRecord[]> => fetchApi("/fi/instruments");
export const getFiInstrument = (stockId: string): Promise<ApiRecord> => fetchApi(`/fi/instruments/${stockId}`);
export const saveFiInstrument = (stockId: string, data: ApiRecord): Promise<ApiRecord> =>
  fetchApi(`/fi/instruments/${stockId}`, { method: "PUT", body: JSON.stringify(data) });
export const ensureFiInstrument = (stockId: string): Promise<ApiRecord> =>
  fetchApi(`/fi/instruments/${stockId}/ensure`, { method: "POST" });
export const getFiPortfolioLots = (portfolioId: string): Promise<ApiRecord[]> =>
  fetchApi(`/fi/portfolios/${portfolioId}/lots`);
export const getFiLotDailyPnl = (lotId: string, filters?: Record<string, string>): Promise<ApiRecord[]> =>
  fetchApi(`/fi/lots/${lotId}/daily-pnl${queryString(filters)}`);
export const rebuildFiLotDailyPnl = (lotId: string, endDate?: string): Promise<ApiRecord> =>
  fetchApi(`/fi/lots/${lotId}/rebuild-daily-pnl`, { method: "POST", body: JSON.stringify({ endDate }) });
export const rebuildFiPortfolioDailyPnl = (portfolioId: string, endDate?: string): Promise<ApiRecord> =>
  fetchApi(`/fi/portfolios/${portfolioId}/rebuild-daily-pnl`, { method: "POST", body: JSON.stringify({ endDate }) });
export const syncFiLotFromTransaction = (txId: string): Promise<ApiRecord> =>
  fetchApi(`/fi/transactions/${txId}/sync-lot`, { method: "POST" });

export type FeeChargeType = "rebate_commission" | "management_fee" | "performance_fee";
export type FeeChargeStatus = "pending" | "approved" | "rejected";

export interface FeeBand {
  id: string;
  mandateId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  rebateCommissionPct: number;
  annualManagementFeePct: number;
  performanceFeePct: number;
  performanceFrequency: "annual" | "quarterly";
  performanceHurdlePct: number;
  highWaterMark: number;
  notes: string | null;
}

export interface FeeCharge {
  id: string;
  portfolioId: string;
  customerId: string;
  mandateId: string;
  feeBandId: string | null;
  type: FeeChargeType;
  periodMonth: string;
  periodEndDate: string;
  notional: number;
  holdingsMv: number;
  cashAsOf: number;
  nav: number;
  ratePct: number;
  amount: number;
  hwmBefore: number | null;
  excess: number | null;
  twrPct: number | null;
  status: FeeChargeStatus;
  notes: string | null;
  customerName?: string | null;
  accountNumber?: string | null;
  decisionReason?: string | null;
}

export const getFeeBands = (customerId: string): Promise<FeeBand[]> =>
  fetchApi(`/mandates/customer/${customerId}/fee-bands`);
export const createFeeBand = (customerId: string, data: ApiRecord): Promise<FeeBand> =>
  fetchApi(`/mandates/customer/${customerId}/fee-bands`, { method: "POST", body: JSON.stringify(data) });
export const updateFeeBand = (bandId: string, data: ApiRecord): Promise<FeeBand> =>
  fetchApi(`/mandates/fee-bands/${bandId}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteFeeBand = (bandId: string) =>
  fetchApi(`/mandates/fee-bands/${bandId}`, { method: "DELETE" });

export const getFeeCharges = (filters?: Record<string, string | number | undefined>): Promise<{
  data: FeeCharge[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> => fetchApi(`/fees/charges${queryString(filters)}`);
export const getFeeSummary = (): Promise<{
  managementEarned: number;
  performanceEarned: number;
  rebatePaid: number;
  pendingCount: number;
  pendingAmount: number;
}> => fetchApi("/fees/summary");
export const getFeePendingCount = (): Promise<{ count: number }> => fetchApi("/fees/pending-count");
export const generateFeeCharges = (data: { portfolioId?: string; month?: string }) =>
  fetchApi("/fees/charges/generate", { method: "POST", body: JSON.stringify(data) });
export const approveFeeCharge = (id: string, reason?: string) =>
  fetchApi(`/fees/charges/${id}/approve`, { method: "POST", body: JSON.stringify({ reason: reason || "" }) });
export const rejectFeeCharge = (id: string, reason: string) =>
  fetchApi(`/fees/charges/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
export const bulkApproveFeeCharges = (ids: string[], reason?: string) =>
  fetchApi("/fees/charges/bulk-approve", { method: "POST", body: JSON.stringify({ ids, reason: reason || "" }) });
export const bulkRejectFeeCharges = (ids: string[], reason: string) =>
  fetchApi("/fees/charges/bulk-reject", { method: "POST", body: JSON.stringify({ ids, reason }) });

export const updateStockClassification = (id: string, data: ApiRecord): Promise<ApiRecord> =>
  fetchApi(`/stocks/${id}/classification`, { method: "PATCH", body: JSON.stringify(data) });
export const bulkUpdateStockClassification = async (
  rows: { id: string; shariahGroup?: string; regulatoryStatus?: string; avgDailyTradedValue?: number; isTradable?: boolean; notes?: string }[],
) => {
  const results = [];
  for (const row of rows) {
    const { id, ...data } = row;
    results.push(await updateStockClassification(id, data));
  }
  return results;
};

export type HistoricalSheetKind = "securities" | "prices" | "indices" | "client" | "trades" | "cash";

export interface HistoricalSheetStep {
  kind: HistoricalSheetKind;
  label: string;
  typicalFile: string;
  purpose: string;
  requiredKeys: string[];
}

export interface HistoricalImportRecord {
  id: string;
  kind: HistoricalSheetKind;
  status: "committed" | "replaced" | "deleted";
  fileName: string;
  rowCount: number;
  skippedCount: number;
  customerId: string | null;
  portfolioId: string | null;
  clientKey: string | null;
  summary: Record<string, unknown> | null;
  createdAt: string;
}

export interface SheetIdentity {
  name: string;
  email: string;
  accountNumber: string;
  mobile: string;
  nin: string;
  notes?: string;
}

export interface SheetIssue {
  code: "MISSING_KEYS" | "KIND_MISMATCH" | "NO_PARSED_ROWS" | "SKIPPED_ROWS" | "MIXED_CLIENT_CODES";
  severity: "error" | "warning";
  detail: string;
}

export interface SheetGridPreview {
  headers: string[];
  rows: string[][];
  sheetRowCount: number;
  sheetColCount: number;
  truncated: boolean;
}

export interface HistoricalValidateResult {
  kind: HistoricalSheetKind | null;
  detectedFromFilename: HistoricalSheetKind | null;
  detectedFromHeaders: HistoricalSheetKind | null;
  valid: boolean;
  foundKeys: string[];
  missingKeys: string[];
  headers: string[];
  parsedCount: number;
  skippedCount: number;
  skippedBuySell?: number;
  sample: unknown[];
  headerIndex?: number;
  grid?: SheetGridPreview;
  identity?: SheetIdentity;
  issues?: SheetIssue[];
}

export interface SheetPortfolioPreview {
  clientName: string;
  clientCode: string;
  asOf: string;
  portfolioId: string;
  holdings: Holding[];
  cashBal: number;
  equityMv: number;
  nav: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  twar: number;
  allocation?: { cash?: { value: number; weight: number }; sectors?: Array<{ sector: string; value: number; weight: number }> };
  excelWorkbook?: {
    growthPct?: number | null;
    gain?: number;
    indexPerformancePct?: number | null;
    indexName?: string | null;
    indexFromDate?: string | null;
    indexToDate?: string | null;
  };
  dailyChanges?: { date: string; nav: number; chgQar: number | null; chgPct: number | null }[];
  valueHistory?: { date: string; value: number }[];
  parsed?: { trades: number; cash: number; skippedTrades: number; skippedCash: number };
}

export const getHistoricalImportCatalog = (): Promise<{ steps: HistoricalSheetStep[] }> =>
  fetchApi("/historical-import/catalog");

export const getHistoricalImports = (): Promise<HistoricalImportRecord[]> =>
  fetchApi("/historical-import");

export function previewHistoricalPortfolio(
  trades: File,
  cash: File,
  opts?: { asOf?: string; name?: string; accountNumber?: string },
): Promise<SheetPortfolioPreview> {
  const formData = new FormData();
  formData.append("trades", trades);
  formData.append("cash", cash);
  if (opts?.asOf) formData.append("asOf", opts.asOf);
  if (opts?.name) formData.append("name", opts.name);
  if (opts?.accountNumber) formData.append("accountNumber", opts.accountNumber);
  return fetchApi("/historical-import/preview-portfolio", { method: "POST", body: formData });
}

export function validateHistoricalSheet(file: File, kind?: HistoricalSheetKind): Promise<HistoricalValidateResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (kind) formData.append("kind", kind);
  return fetchApi("/historical-import/validate", { method: "POST", body: formData });
}

export function commitHistoricalSheet(
  file: File,
  kind: HistoricalSheetKind,
  opts?: { replace?: boolean; customerId?: string | null },
): Promise<HistoricalImportRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);
  if (opts?.replace) formData.append("replace", "true");
  if (opts?.customerId) formData.append("customerId", opts.customerId);
  return fetchApi("/historical-import/commit", { method: "POST", body: formData });
}

export const deleteHistoricalImport = (id: string): Promise<HistoricalImportRecord> =>
  fetchApi(`/historical-import/${id}`, { method: "DELETE" });

export interface PortfolioFormulaRow {
  key: string;
  label: string;
  category: string;
  excelFormula: string;
  expression: string;
  defaultExpression?: string;
  inputs: string[];
  description: string | null;
  updatedAt?: string | null;
}

export interface PortfolioFormulaColumn {
  id: string;
  source: string;
}

export const getPortfolioFormulas = (): Promise<{
  formulas: PortfolioFormulaRow[];
  columns: PortfolioFormulaColumn[];
}> => fetchApi("/portfolio-formulas");

export function updatePortfolioFormula(key: string, expression: string): Promise<PortfolioFormulaRow> {
  return fetchApi(`/portfolio-formulas/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ expression }),
  });
}

// ── Phase 2: simulator / OMS / reports / recon / ops forms ─────────────────

export function simulateTrade(body: {
  portfolioId: string;
  legs: Array<{ stockId: string; side: "BUY" | "SELL"; quantity: number; price?: number; commissionRate?: number }>;
}): Promise<{
  portfolioId: string;
  cashBefore: number;
  cashAfter: number;
  equityAfter: number;
  navAfter: number;
  legs: ApiRecord[];
  stockWeights: ApiRecord[];
  sectorWeights: Array<{ sector: string; weight: number }>;
  weightImpact: Array<{ stockId: string; ticker: string; before: number; after: number; delta: number }>;
  compliance: { passed: boolean; checks: Array<{ checkCode: string; result: string; message?: string }> };
}> {
  return fetchApi("/simulator/run", { method: "POST", body: JSON.stringify(body) });
}

export function listOrders(filters?: { portfolioId?: string; status?: string }): Promise<{ data: Array<{
  id: string;
  portfolioId: string;
  stockId: string;
  side: string;
  quantity: string;
  filledQuantity: string;
  status: string;
  broker: string | null;
  limitPrice: string | null;
}> }> {
  return fetchApi(`/orders${queryString(filters)}`);
}

export function createOrder(body: ApiRecord) {
  return fetchApi("/orders", { method: "POST", body: JSON.stringify(body) });
}

export function transitionOrder(id: string, status: string) {
  return fetchApi(`/orders/${id}/transition`, { method: "POST", body: JSON.stringify({ status }) });
}

export function recordFill(id: string, body: { fillQty: number; fillPrice: number; commission?: number; notes?: string }) {
  return fetchApi(`/orders/${id}/fills`, { method: "POST", body: JSON.stringify(body) });
}

export function createBlockGroup(body: ApiRecord) {
  return fetchApi("/orders/blocks", { method: "POST", body: JSON.stringify(body) });
}

export function fillBlock(id: string, body: { fillQty: number; fillPrice: number }) {
  return fetchApi(`/orders/blocks/${id}/fill`, { method: "POST", body: JSON.stringify(body) });
}

export function listReportReleases(): Promise<{ data: Array<{
  id: string; kind: string; periodLabel: string; status: string; portfolioId?: string | null;
  payload?: Record<string, unknown> | null;
}> }> {
  return fetchApi("/reports/releases");
}

export function createReportRelease(body: { kind: string; periodLabel: string; portfolioId?: string }) {
  return fetchApi("/reports/releases", { method: "POST", body: JSON.stringify(body) });
}

export function releaseReport(id: string) {
  return fetchApi(`/reports/releases/${id}/release`, { method: "POST", body: JSON.stringify({}) });
}

export function listReconciliationRuns(): Promise<{ data: Array<{
  id: string; asOf: string; status: string; holdingsDiffCount: number; cashDiff: string;
}> }> {
  return fetchApi("/reconciliation");
}

export function runReconciliation(body: { asOf: string; notes?: string }) {
  return fetchApi("/reconciliation/run", { method: "POST", body: JSON.stringify(body) });
}

export function resolveReconciliation(id: string, body: { status: "cleared" | "explained"; explanation?: string }) {
  return fetchApi(`/reconciliation/${id}/resolve`, { method: "POST", body: JSON.stringify(body) });
}

export function listOpsForms(): Promise<{ data: Array<{
  id: string; formCode: string; status: string; createdAt?: string;
}>; formCodes: string[] }> {
  return fetchApi("/ops-forms");
}

export function createOpsForm(body: { formCode: string; mandateId?: string; portfolioId?: string; payload?: ApiRecord }) {
  return fetchApi("/ops-forms", { method: "POST", body: JSON.stringify(body) });
}

export function approveOpsForm(id: string) {
  return fetchApi(`/ops-forms/${id}/approve`, { method: "POST", body: JSON.stringify({}) });
}

// ── Phase 3: markets / screener / research ─────────────────────────────────

export function getMarketOverview(): Promise<{
  asOf: string | null;
  indices: Array<{ id: string; name: string; date: string | null; level: number | null; change: number | null; changePct: number | null }>;
  breadth: { advancers: number; decliners: number; unchanged: number; asOf: string | null };
  topGainers: Array<{ stockId: string; ticker: string; changePct: number; close: number }>;
  topLosers: Array<{ stockId: string; ticker: string; changePct: number; close: number }>;
  topByValue: Array<{ stockId: string; ticker: string; value: number | null; close: number }>;
}> {
  return fetchApi("/markets/overview");
}

export function runScreener(filters?: {
  sector?: string; shariahGroup?: string; regulatoryStatus?: string; search?: string;
  minAdtv?: number; illiquid?: boolean; qeriMember?: boolean; dsmMember?: boolean;
}): Promise<{ asOf: string | null; count: number; data: Array<{
  id: string; ticker: string; companyName: string; sector: string; shariahGroup: string | null;
  lastClose: number | null; isIlliquid: boolean; regulatoryStatus: string;
  approvedListStatus: string; avgDailyTradedValue: number | null; valuationNote: string;
}> }> {
  return fetchApi(`/screener${queryString(filters)}`);
}

export function listApprovedList(status?: string): Promise<{ data: Array<{
  id: string; stockId: string; status: string; notes: string | null;
  ticker: string; companyName: string; sector: string; shariahGroup: string | null;
}> }> {
  return fetchApi(`/research/approved-list${queryString(status ? { status } : undefined)}`);
}

export function setApprovedListStatus(stockId: string, body: { status: string; notes?: string }) {
  return fetchApi(`/research/approved-list/${stockId}`, { method: "PUT", body: JSON.stringify(body) });
}

export function getCompanyResearch(stockId: string): Promise<{
  stock: StockData;
  approvedList: { status: string; notes?: string | null };
  layers: Array<{ layer: string; status: string; notes: string | null; analystName: string | null; assessedAt: string | null }>;
  satelliteGate: { allowed: boolean; message: string; reasonCode?: string };
  note: string;
}> {
  return fetchApi(`/research/companies/${stockId}`);
}

export function upsertResearchLayer(stockId: string, layer: string, body: {
  status: string; notes?: string; analystName?: string; assessedAt?: string; evidenceUrl?: string;
}) {
  return fetchApi(`/research/companies/${stockId}/layers/${layer}`, { method: "PUT", body: JSON.stringify(body) });
}

export function requestResearchException(stockId: string, reason: string) {
  return fetchApi(`/research/companies/${stockId}/exceptions`, { method: "POST", body: JSON.stringify({ reason }) });
}

export function getStockAnalytics(stockId: string, days?: number): Promise<{
  stock: { id: string; ticker: string; companyName: string; sector: string };
  series: Array<{ date: string; close: number; volume: number | null; ma50: number | null }>;
  note: string;
}> {
  return fetchApi(`/research/analytics/${stockId}${queryString(days != null ? { days } : undefined)}`);
}

export function listShariaEsg(): Promise<{ data: Array<{
  id: string; stockId: string; ticker: string; companyName: string;
  shariahGroup: string | null; reviewDate: string | null; esgScore: string | null; syncToStock: boolean;
}>; esgNote: string }> {
  return fetchApi("/research/sharia-esg");
}

export function createShariaEsgReview(body: ApiRecord) {
  return fetchApi("/research/sharia-esg", { method: "POST", body: JSON.stringify(body) });
}

export function listStrategies(): Promise<{ data: Array<{
  id: string; modelCode: string; title: string; approvalStatus: string; body: string | null;
}> }> {
  return fetchApi("/research/strategies");
}

export function createStrategy(body: ApiRecord) {
  return fetchApi("/research/strategies", { method: "POST", body: JSON.stringify(body) });
}

export function transitionStrategy(id: string, status: string) {
  return fetchApi(`/research/strategies/${id}/transition`, { method: "POST", body: JSON.stringify({ status }) });
}

export function listStockScores(): Promise<{
  config: { confirmed: boolean; notes?: string | null; factors: unknown };
  scores: Array<{ stockId: string; ticker: string; score: string | null; rank: number | null }>;
  advisoryOnly: boolean;
  message: string;
}> {
  return fetchApi("/research/scores");
}

// ── Phase 4: AI / commentary / scenarios / frontier ────────────────────────

export function getAiHealth(): Promise<{
  geminiConfigured: boolean; analysisOnly: boolean; disclosure: string;
  forbiddenActions: string[]; allowedPromptTypes: string[];
}> {
  return fetchApi("/ai/health");
}

export function listAiGovernance(): Promise<{ data: Array<{
  id: string; promptType: string; model: string; disclosure: string;
  accepted: boolean | null; createdAt?: string; outputRef?: string | null;
}> }> {
  return fetchApi("/ai/governance");
}

export function runAiAssist(body: {
  promptType: string; portfolioId?: string; extra?: string;
}): Promise<{
  logId: string; promptType: string; model: string; disclosure: string;
  draft: string; analysisOnly: boolean; forbiddenActions: string[];
}> {
  return fetchApi("/ai/assist", { method: "POST", body: JSON.stringify(body) });
}

export function acceptAiLog(id: string, accepted: boolean) {
  return fetchApi(`/ai/governance/${id}/accept`, { method: "POST", body: JSON.stringify({ accepted }) });
}

export function listCommentary(): Promise<{ data: Array<{
  id: string; kind: string; status: string; body: string; periodLabel: string | null;
}> }> {
  return fetchApi("/commentary");
}

export function generateCommentary(body: { kind: string; periodLabel?: string; portfolioId?: string; reportReleaseId?: string }) {
  return fetchApi("/commentary/generate", { method: "POST", body: JSON.stringify(body) });
}

export function reviewCommentary(id: string, body: { status: string; body?: string }) {
  return fetchApi(`/commentary/${id}/review`, { method: "POST", body: JSON.stringify(body) });
}

export function listScenarios(portfolioId?: string): Promise<{ data: Array<{
  id: string; name: string | null; kind: string; portfolioId: string; createdAt?: string;
}> }> {
  return fetchApi(`/scenarios${queryString(portfolioId ? { portfolioId } : undefined)}`);
}

export function runScenario(body: ApiRecord): Promise<{ scenario: ApiRecord | null; result: ApiRecord }> {
  return fetchApi("/scenarios/run", { method: "POST", body: JSON.stringify(body) });
}

export function runFrontier(body: { portfolioId: string; maxNames?: number }): Promise<{
  run: ApiRecord;
  status: string;
  advisoryOnly?: boolean;
  confirmation?: string;
  proposed?: Array<{ ticker: string; weight: number; sector: string }>;
  message?: string;
  builderDraft?: ApiRecord;
}> {
  return fetchApi("/frontier/run", { method: "POST", body: JSON.stringify(body) });
}

export function listFrontierRuns(portfolioId?: string): Promise<{ data: ApiRecord[] }> {
  return fetchApi(`/frontier${queryString(portfolioId ? { portfolioId } : undefined)}`);
}

// ── Super Admin: system config ─────────────────────────────────────────────

export function getSystemConfig(): Promise<{
  ipsLimits: Array<{ key: string; value: string; unit: string; description: string | null }>;
  settings: Array<{
    key: string; value: string; valueType: string; category: string;
    description: string | null; confirmed: boolean; source: string;
  }>;
  note: string;
}> {
  return fetchApi("/system-config");
}

export function updateSystemIps(key: string, body: { value: number | string; description?: string }) {
  return fetchApi(`/system-config/ips/${key}`, { method: "PUT", body: JSON.stringify(body) });
}

export function updateSystemSetting(key: string, body: { value: string | boolean; confirmed?: boolean }) {
  return fetchApi(`/system-config/settings/${key}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listSystemUniverse(): Promise<{ data: Array<{
  id: string; ticker: string; companyName: string; sector: string;
  shariahGroup: string | null; isIlliquid: boolean; isTradable: boolean;
  avgDailyTradedValue: number | null; regulatoryStatus: string;
  approvedListStatus: string;
}> }> {
  return fetchApi("/system-config/universe");
}

export function updateSystemUniverseStock(stockId: string, body: ApiRecord) {
  return fetchApi(`/system-config/universe/${stockId}`, { method: "PUT", body: JSON.stringify(body) });
}

export function refreshSystemIlliquid() {
  return fetchApi("/system-config/refresh-illiquid", { method: "POST", body: JSON.stringify({}) });
}

export type OfficialCloseRow = {
  stockId: string;
  ticker: string;
  companyName: string;
  date: string;
  price: number;
  closePrice: number;
};

export function getOfficialClosesSummary(): Promise<{
  rowCount: number;
  minDate: string | null;
  maxDate: string | null;
  kbFile: string;
  kbFileExists: boolean;
  sample: { ticker: string; date: string; close: number | null };
}> {
  return fetchApi("/system-config/prices/summary");
}

export function listOfficialCloses(params?: {
  ticker?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; limit: number; offset: number; data: OfficialCloseRow[] }> {
  const q = new URLSearchParams();
  if (params?.ticker) q.set("ticker", params.ticker);
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  const qs = q.toString();
  return fetchApi(`/system-config/prices${qs ? `?${qs}` : ""}`);
}

export function upsertOfficialClose(body: { ticker: string; date: string; price: number }) {
  return fetchApi("/system-config/prices", { method: "POST", body: JSON.stringify(body) });
}

export function deleteOfficialClose(ticker: string, date: string) {
  return fetchApi(`/system-config/prices/${encodeURIComponent(ticker)}/${encodeURIComponent(date)}`, {
    method: "DELETE",
  });
}

export function importKbOfficialCloses(): Promise<{
  filePath: string;
  parsed: number;
  skippedParse: number;
  upserted: number;
  unknownTickers: number;
  unknownSample: string[];
}> {
  return fetchApi("/system-config/prices/import-kb", { method: "POST", body: JSON.stringify({}) });
}

export function uploadOfficialClosesFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi("/system-config/prices/upload", { method: "POST", body: formData });
}

export function getKbIndexLevelsSummary(): Promise<{
  rowCount: number;
  minDate: string | null;
  maxDate: string | null;
  qeriCount: number;
  dsmCount: number;
  kbFile: string;
  kbFileExists: boolean;
  sampleQeri: { date: string; value: number | null; expected: number };
  sampleDsm: { date: string; value: number | null; expected: number };
}> {
  return fetchApi("/system-config/indices/summary");
}

export function importKbIndexLevels(): Promise<{
  filePath: string;
  parsed: number;
  skippedParse: number;
  skippedOtherSeries: number;
  upserted: number;
  qeri: number;
  dsm: number;
}> {
  return fetchApi("/system-config/indices/import-kb", { method: "POST", body: JSON.stringify({}) });
}

// ── Users admin (P1-USERS) ─────────────────────────────────────────────────

export type StaffUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function listUsers(): Promise<StaffUser[]> {
  return fetchApi("/users");
}

export function createUser(body: {
  username: string;
  password: string;
  displayName?: string;
  role?: string;
  status?: string;
}): Promise<StaffUser> {
  return fetchApi("/users", { method: "POST", body: JSON.stringify(body) });
}

export function updateUser(
  id: string,
  body: { displayName?: string; role?: string; status?: string; password?: string },
): Promise<StaffUser> {
  return fetchApi(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteUser(id: string): Promise<{ ok: boolean }> {
  return fetchApi(`/users/${id}`, { method: "DELETE" });
}

