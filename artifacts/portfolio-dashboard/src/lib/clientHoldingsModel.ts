import type { Holding, PortfolioData, SheetPortfolioPreview } from "@/lib/api";
import type { SectorAlloc } from "@/components/phase1/HistoricalPortfolioDashboard";

export type ClientHoldingsViewModel = {
  clientName: string;
  clientCode: string;
  asOf: string;
  viewingPast: boolean;
  holdings: Holding[];
  cashBal: number;
  nav: number;
  equityMv: number;
  openPositions: number;
  openLotsCost: number;
  netCashInvested: number;
  cashWeight: number | undefined;
  sectors: SectorAlloc[];
  navWeightByStock: Map<string, number | undefined>;
  excelGrowthPct: number | null | undefined;
  excelGain: number | null | undefined;
  indexPerformancePct: number | null;
  indexName: string | null | undefined;
  indexFromDate: string | null | undefined;
  indexToDate: string | null | undefined;
  /** Cash row Buying Date — first funding/trade date (Excel Cash buying date). */
  cashOpenedOn: string | null;
  cashHoldingDays: number | null;
  dailyChanges: Array<{ date: string; nav: number; chgQar: number | null; chgPct: number | null }>;
  unrealizedPnL: number;
  realizedPnL: number;
  twar: number;
  equityDailyChg: number | null;
  equityDailyPct: number | null;
  equityHistory: Array<{ date: string; value: number }>;
  portfolioId: string;
};

type ExcelBook = {
  growthPct?: number | null;
  gain?: number;
  indexPerformancePct?: number | null;
  indexName?: string | null;
  indexFromDate?: string | null;
  indexToDate?: string | null;
};

type Phase1Like = {
  valuation?: { invested?: number; cash?: number; nav?: number; totalInvested?: number };
  allocation?: { cash?: { value: number; weight: number }; sectors?: SectorAlloc[] };
  holdings?: Array<{ stockId: string; weight?: number }>;
  excelWorkbook?: ExcelBook;
  dailyChanges?: ClientHoldingsViewModel["dailyChanges"];
};

export type { SheetPortfolioPreview };

/** Excel DATEDIF(..., "d") on YYYY-MM-DD strings. Display helper only. */
function calendarDaysBetween(fromIso: string, toIso: string): number | null {
  const ymd = (s: string) => {
    const p = s.slice(0, 10).split("-").map(Number);
    if (p.length < 3 || p.some((n) => !Number.isFinite(n))) return null;
    return Date.UTC(p[0], p[1] - 1, p[2]);
  };
  const from = ymd(fromIso);
  const to = ymd(toIso);
  if (from == null || to == null) return null;
  return Math.round((to - from) / 86_400_000);
}

export function buildClientHoldingsViewModel(input: {
  customer: {
    id: string;
    name: string;
    accountNumber?: string | null;
    idNumber?: string | null;
    portfolioId: string;
    totalInvested?: number;
    currentValue?: number;
  };
  asOf: string;
  today: string;
  portfolio?: (Partial<PortfolioData> & { unrealizedPnL?: number; realizedPnL?: number }) | null;
  phase1?: Phase1Like | null;
  cashLedger?: { balance?: number } | null;
  preview?: SheetPortfolioPreview | null;
}): ClientHoldingsViewModel {
  const preview = input.preview;
  const holdings = preview?.holdings ?? input.portfolio?.holdings ?? [];
  const openLotsCost = holdings.reduce((sum, h) => sum + Number(h.totalCost || 0), 0);
  const fromHoldings = holdings
    .filter((h): h is Holding & { excelWeight: number } => h.excelWeight != null)
    .map((h) => [h.stockId, h.excelWeight] as const);
  const phaseRows = Array.isArray(input.phase1?.holdings) ? input.phase1!.holdings! : [];
  const navWeightByStock = fromHoldings.length > 0
    ? new Map<string, number | undefined>(fromHoldings)
    : new Map(phaseRows.map((h) => [h.stockId, h.weight]));

  const equityMv = Number(preview?.equityMv ?? input.portfolio?.currentValue ?? input.phase1?.valuation?.invested ?? input.customer.currentValue ?? 0);
  const cashBal = Number(preview?.cashBal ?? input.portfolio?.cashBalance ?? input.phase1?.valuation?.cash ?? input.cashLedger?.balance ?? 0);
  const nav = Number(preview?.nav ?? input.portfolio?.navValue ?? input.phase1?.valuation?.nav ?? equityMv + cashBal);
  const allocation = preview?.allocation ?? input.portfolio?.allocation ?? input.phase1?.allocation;
  const equityHistory = preview?.valueHistory ?? input.portfolio?.valueHistory ?? [];
  const dailyChanges = preview?.dailyChanges
    ?? input.portfolio?.dailyChanges
    ?? input.phase1?.dailyChanges
    ?? [];
  const navPrev = dailyChanges.length >= 2 ? dailyChanges[dailyChanges.length - 2] : null;
  const navLast = dailyChanges.length >= 1 ? dailyChanges[dailyChanges.length - 1] : null;
  const equityDailyChg = navLast && navPrev
    ? navLast.chgQar
    : (equityHistory.length >= 2 ? equityHistory[equityHistory.length - 1].value - equityHistory[equityHistory.length - 2].value : null);
  const equityDailyPct = navLast && navPrev && navLast.chgPct != null
    ? navLast.chgPct
    : (equityHistory.length >= 2 && equityHistory[equityHistory.length - 2].value !== 0
      ? ((equityHistory[equityHistory.length - 1].value - equityHistory[equityHistory.length - 2].value) / equityHistory[equityHistory.length - 2].value) * 100
      : null);
  const excelWorkbook = preview?.excelWorkbook
    ?? input.portfolio?.excelWorkbook
    ?? input.phase1?.excelWorkbook;

  return {
    clientName: preview?.clientName || input.customer.name,
    clientCode: preview?.clientCode || input.customer.accountNumber || input.customer.idNumber || input.customer.id.slice(0, 8),
    asOf: input.asOf,
    viewingPast: input.asOf < input.today,
    holdings,
    cashBal,
    nav,
    equityMv,
    openPositions: holdings.length,
    openLotsCost,
    netCashInvested: Number(preview?.totalInvested ?? input.portfolio?.totalInvested ?? input.phase1?.valuation?.totalInvested ?? input.customer.totalInvested ?? 0),
    cashWeight: allocation?.cash?.weight,
    sectors: allocation?.sectors ?? [],
    navWeightByStock,
    excelGrowthPct: excelWorkbook?.growthPct,
    excelGain: excelWorkbook?.gain,
    indexPerformancePct: excelWorkbook?.indexPerformancePct ?? null,
    indexName: excelWorkbook?.indexName,
    indexFromDate: excelWorkbook?.indexFromDate,
    indexToDate: excelWorkbook?.indexToDate,
    cashOpenedOn: excelWorkbook?.indexFromDate ?? null,
    cashHoldingDays: excelWorkbook?.indexFromDate
      ? calendarDaysBetween(excelWorkbook.indexFromDate, input.asOf)
      : null,
    dailyChanges,
    unrealizedPnL: Number(preview?.unrealizedPnL ?? input.portfolio?.unrealizedPnL ?? 0),
    realizedPnL: Number(preview?.realizedPnL ?? input.portfolio?.realizedPnL ?? 0),
    twar: Number(preview?.twar ?? input.portfolio?.twar ?? 0),
    equityDailyChg,
    equityDailyPct,
    equityHistory,
    portfolioId: preview?.portfolioId || input.customer.portfolioId,
  };
}

export function emptyClientHoldingsViewModel(): ClientHoldingsViewModel {
  return {
    clientName: "",
    clientCode: "",
    asOf: "",
    viewingPast: false,
    holdings: [],
    cashBal: 0,
    nav: 0,
    equityMv: 0,
    openPositions: 0,
    openLotsCost: 0,
    netCashInvested: 0,
    cashWeight: undefined,
    sectors: [],
    navWeightByStock: new Map(),
    excelGrowthPct: null,
    excelGain: null,
    indexPerformancePct: null,
    indexName: null,
    indexFromDate: null,
    indexToDate: null,
    cashOpenedOn: null,
    cashHoldingDays: null,
    dailyChanges: [],
    unrealizedPnL: 0,
    realizedPnL: 0,
    twar: 0,
    equityDailyChg: null,
    equityDailyPct: null,
    equityHistory: [],
    portfolioId: "",
  };
}
