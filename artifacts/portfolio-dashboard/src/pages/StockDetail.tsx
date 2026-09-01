import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import {
  getStock,
  getStockPrices,
  exportStockPrices,
  createCorporateAction,
  updateCorporateAction,
  deleteCorporateAction,
  updateStockClassification,
  deleteStockPrice,
  type StockDetailData,
  type CorporateAction,
  type CorporateActionResult,
  type CorporateActionPortfolioImpact,
  type StockPricePoint,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  AppTable,
  CLIENT_PAGE_SIZES,
  DataTableEmpty,
  DataTableHead,
  DataTableSkeletonRows,
  DataTableToolbar,
  useClientTablePage,
} from "@/components/phase1/DataTableCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StockPricePointDialog, StockExcelUploadButton } from "@/components/StockPricePointDialog";
import { ExcelIcon } from "@/components/phase1/ExportFormatIcons";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import {
  ChevronLeft, Plus, PenLine, Trash2, Loader2, AlertTriangle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area,
} from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shariahGroupLabel, normalizeShariahGroup } from "@/lib/mandatePreview";
import { SelectField } from "@/components/phase1/SelectField";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { TimeRangeToggle } from "@/components/phase1/TimeRangeToggle";
import { EmptyState } from "@/components/phase1/PageHeader";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { ChangeChip } from "@/components/phase1/ChangeChip";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

const formatNum = (val: number | null | undefined, digits = 4) => {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("en-QA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(val);
};

const formatInt = (val: number | null | undefined) => {
  if (val === null || val === undefined) return "—";
  return new Intl.NumberFormat("en-QA", { maximumFractionDigits: 0 }).format(val);
};

// ---------------------------------------------------------------------------
// Corporate Action Form Dialog
// ---------------------------------------------------------------------------
function CorporateActionDialog({
  open,
  onOpenChange,
  stockId,
  ticker,
  editCa,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stockId: string;
  ticker: string;
  editCa: CorporateAction | null;
  onSuccess: (impact?: CorporateActionPortfolioImpact) => void;
}) {
  const { t } = useTranslation();
  const [actionDate, setActionDate] = useState(editCa?.actionDate || "");
  const [actionType, setActionType] = useState<"BONUS" | "STOCK_SPLIT" | "DIVIDEND">(editCa?.actionType || "BONUS");
  const [ratio, setRatio] = useState(editCa?.ratio?.toString() || "");
  const [cashAmount, setCashAmount] = useState(editCa?.cashAmount?.toString() || "");
  const [error, setError] = useState("");

  const isEdit = !!editCa;

  const createMut = useMutation({
    mutationFn: () =>
      createCorporateAction(stockId, {
        actionDate,
        actionType,
        ratio: actionType !== "DIVIDEND" ? parseFloat(ratio) : undefined,
        cashAmount: actionType === "DIVIDEND" ? parseFloat(cashAmount) : undefined,
      }),
    onSuccess: (result: CorporateActionResult) => {
      onSuccess(result.portfolioImpact);
      onOpenChange(false);
      resetForm();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateCorporateAction(stockId, editCa!.id, {
        actionDate,
        actionType,
        ratio: actionType !== "DIVIDEND" ? parseFloat(ratio) : undefined,
        cashAmount: actionType === "DIVIDEND" ? parseFloat(cashAmount) : undefined,
      }),
    onSuccess: (result: CorporateActionResult) => {
      onSuccess(result.portfolioImpact);
      onOpenChange(false);
      resetForm();
    },
    onError: (e: Error) => setError(e.message),
  });

  const pending = createMut.isPending || updateMut.isPending;

  function resetForm() {
    setActionDate("");
    setActionType("BONUS");
    setRatio("");
    setCashAmount("");
    setError("");
  }

  function handleOpen(open: boolean) {
    if (open && editCa) {
      setActionDate(editCa.actionDate);
      setActionType(editCa.actionType);
      setRatio(editCa.ratio?.toString() || "");
      setCashAmount(editCa.cashAmount?.toString() || "");
    }
    if (!open) resetForm();
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="cdp-modal sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("stockDetail.editCorporateAction") : t("stockDetail.addCorporateAction")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("stockDetail.caDialogDescEdit", { ticker }) : t("stockDetail.caDialogDescCreate", { ticker })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("common.ticker")}</Label>
            <Input value={ticker} disabled className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("stockDetail.actionDate")}</Label>
            <DatePicker value={actionDate} onChange={setActionDate} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("stockDetail.actionType")}</Label>
            <SelectField
              className="w-full font-mono"
              value={actionType}
              onValueChange={(v) => setActionType(v as "BONUS" | "STOCK_SPLIT" | "DIVIDEND")}
              options={[
                { value: "BONUS", label: "BONUS" },
                { value: "STOCK_SPLIT", label: "STOCK_SPLIT" },
                { value: "DIVIDEND", label: "DIVIDEND" },
              ]}
            />
          </div>
          {(actionType === "BONUS" || actionType === "STOCK_SPLIT") && (
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("stockDetail.ratio")}</Label>
              <Input
                type="number"
                step="any"
                placeholder={t("stockDetail.ratioPlaceholder")}
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
          {actionType === "DIVIDEND" && (
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("stockDetail.cashAmount")}</Label>
              <Input
                type="number"
                step="any"
                placeholder={t("stockDetail.cashAmountPlaceholder")}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="font-mono"
              />
            </div>
          )}
          {error && <p className="text-sm text-rose-500 font-mono">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => (isEdit ? updateMut.mutate() : createMut.mutate())}
            disabled={!actionDate || pending}
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {isEdit ? t("common.update") : t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium leading-snug">{children}</div>
    </div>
  );
}

function perfMetric(
  id: string,
  icon: string,
  label: string,
  value: number | null | undefined,
  format: "currency" | "pct",
  na: string,
) {
  const missing = value === null || value === undefined;
  const n = Number(value);
  return {
    id,
    icon,
    label,
    hint: "",
    value: missing
      ? na
      : format === "currency"
        ? <AnimatedNumber value={n} format="currency" />
        : <AnimatedNumber value={n} format="percent" signed />,
    valueClassName: !missing && format === "pct"
      ? (n >= 0 ? "text-[var(--color-positive)]" : "text-loss")
      : undefined,
  };
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

function ClassificationPanel({ stock, onSaved }: { stock: StockDetailData; onSaved: () => void }) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canMutate = canPerformAction("stock.mutate", { role, username });
  const [open, setOpen] = useState(false);
  const [shariahGroup, setShariahGroup] = useState(normalizeShariahGroup(stock.shariahGroup) || "");
  const [regulatoryStatus, setRegulatoryStatus] = useState(stock.regulatoryStatus || "clear");
  const [regulatoryNotes, setRegulatoryNotes] = useState(stock.regulatoryNotes || "");
  const [isTradable, setIsTradable] = useState(stock.isTradable !== false);

  const mutation = useMutation({
    mutationFn: () =>
      updateStockClassification(stock.id, {
        shariahGroup: shariahGroup || null,
        regulatoryStatus,
        regulatoryNotes,
        isTradable,
      }),
    onSuccess: () => {
      onSaved();
      setOpen(false);
    },
  });

  function openEditor() {
    setShariahGroup(normalizeShariahGroup(stock.shariahGroup) || "");
    setRegulatoryStatus(stock.regulatoryStatus || "clear");
    setRegulatoryNotes(stock.regulatoryNotes || "");
    setIsTradable(stock.isTradable !== false);
    setOpen(true);
  }

  const adtv = stock.avgDailyTradedValue != null ? Number(stock.avgDailyTradedValue) : null;
  const membershipLabel = [stock.isQeriMember && "QERI", stock.isDsmMember && "DSM"].filter(Boolean).join(" · ") || t("common.none");

  return (
    <>
      <section className="cdp-sectors mb-6 mx-0" aria-labelledby="ipms-class-title">
        <header className="cdp-sectors-head flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="ipms-class-title">{t("stockDetail.classification")}</h3>
            <p>{t("stockDetail.classificationSub")}</p>
          </div>
          {canMutate && (
          <Button variant="outline" className="cdp-ghost-action" onClick={openEditor}>
            <PenLine className="me-2 h-3.5 w-3.5" /> {t("common.edit")}
          </Button>
          )}
        </header>
        <div className="grid gap-4 py-4 md:grid-cols-3 lg:grid-cols-4">
          <Fact label={t("common.shariah")}>{shariahGroupLabel(stock.shariahGroup)}</Fact>
          <Fact label={t("stockDetail.avgDailyTradedValue")}>
            {adtv != null ? formatCurrency(adtv) : "—"}
            <p className="mt-1 text-[11px] font-normal text-muted-foreground">{t("stockDetail.adtvFromCloseVolume")}</p>
          </Fact>
          <Fact label={t("stockDetail.liquidity")}>{stock.isIlliquid ? t("stocks.illiquid") : t("common.liquid")}</Fact>
          <Fact label={t("stockDetail.regulatoryStatus")}>
            <span className="capitalize">{stock.regulatoryStatus || "clear"}</span>
          </Fact>
          <Fact label={t("stockDetail.tradable")}>{stock.isTradable === false ? t("common.no") : t("common.yes")}</Fact>
          <Fact label={t("stockDetail.indexMembership")}>
            {membershipLabel}
            <p className="mt-1 text-[11px] font-normal text-muted-foreground">{t("stockDetail.indexMembershipHint")}</p>
          </Fact>
          <div className="md:col-span-2">
            <Fact label={t("stockDetail.notes")}>{stock.regulatoryNotes?.trim() || "—"}</Fact>
          </div>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="cdp-modal sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("stockDetail.editClassification")}</DialogTitle>
            <DialogDescription>
              {t("stockDetail.editClassificationDesc", { ticker: stock.ticker })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>{t("common.shariah")}</Label>
              <SelectField
                className="w-full"
                value={shariahGroup}
                onValueChange={setShariahGroup}
                options={[
                  { value: "", label: t("stocks.unclassified") },
                  { value: "shariah", label: t("common.shariah") },
                  { value: "not_shariah", label: t("common.notShariah") },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("stockDetail.regulatoryStatus")}</Label>
              <SelectField
                className="w-full"
                value={regulatoryStatus}
                onValueChange={setRegulatoryStatus}
                options={[
                  { value: "clear", label: t("stocks.regulatoryClear") },
                  { value: "watch", label: t("stocks.watch") },
                  { value: "restricted", label: t("stocks.restricted") },
                  { value: "suspended", label: t("stocks.suspended") },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("stockDetail.notes")}</Label>
              <Input value={regulatoryNotes} onChange={(e) => setRegulatoryNotes(e.target.value)} />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase font-mono text-muted-foreground">{t("stockDetail.trading")}</p>
              <div className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/70">
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("stockDetail.tradable")}</p>
                    <p className="text-xs text-muted-foreground">{t("stockDetail.tradableHint")}</p>
                  </div>
                  <Switch checked={isTradable} onCheckedChange={setIsTradable} />
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
              <p className="text-xs uppercase font-mono text-muted-foreground">{t("stockDetail.indexMembershipReadonly")}</p>
              <p className="font-mono font-semibold mt-1">{membershipLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("stockDetail.indexMembershipReadonlyHint")}
              </p>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm">
              <p className="text-xs uppercase font-mono text-muted-foreground">{t("stockDetail.avgDailyTradedValue")}</p>
              <p className="font-data font-semibold">{adtv != null ? formatCurrency(adtv) : "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("stockDetail.adtvAutoCalc")}</p>
            </div>
            {mutation.isError && <p className="text-sm text-rose-500 font-mono">{(mutation.error as Error).message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>{t("common.cancel")}</Button>
            <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Time Range Filter
// ---------------------------------------------------------------------------
function TimeRangeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <TimeRangeToggle value={value} onChange={onChange} ranges={["1M", "3M", "6M", "1Y", "3Y", "ALL"]} />;
}

function filterByDays<T extends { date: string }>(data: T[], range: string): T[] {
  const days = range === "1M" ? 30 : range === "3M" ? 90 : range === "6M" ? 180 : range === "1Y" ? 365 : range === "3Y" ? 1095 : data.length;
  return data.slice(-days);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function StockDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const portfolioId = new URLSearchParams(location.split("?")[1] || "").get("portfolioId") || undefined;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("1Y");
  const [dateExact, setDateExact] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZES[0]);
  const [exporting, setExporting] = useState<"filtered" | "all" | null>(null);
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<StockPricePoint | null>(null);
  const [deletePriceDate, setDeletePriceDate] = useState<string | null>(null);

  // Corporate action dialog state
  const [caDialogOpen, setCaDialogOpen] = useState(false);
  const [editingCa, setEditingCa] = useState<CorporateAction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CorporateAction | null>(null);
  const [caImpactMessage, setCaImpactMessage] = useState<string | null>(null);

  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock", id, portfolioId],
    queryFn: () => getStock(id!, portfolioId),
    enabled: !!id,
  });

  const { data: pricesPage, isFetching: pricesFetching } = useQuery({
    queryKey: ["stock-prices", id, dateExact, dateFrom, dateTo, page, pageSize],
    queryFn: () =>
      getStockPrices(id!, {
        date: dateExact || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        pageSize,
      }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });

  const corporateActionsList = stock?.corporateActions ?? [];
  const caPaging = useClientTablePage(corporateActionsList, `${id}|${corporateActionsList.length}`);

  const deletePriceMut = useMutation({
    mutationFn: (date: string) => deleteStockPrice(id!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock", id] });
      queryClient.invalidateQueries({ queryKey: ["stock-prices", id] });
      setDeletePriceDate(null);
    },
    onError: () => setDeletePriceDate(null),
  });

  const refreshPrices = () => {
    queryClient.invalidateQueries({ queryKey: ["stock", id] });
    queryClient.invalidateQueries({ queryKey: ["stock-prices", id] });
  };

  // Mutations for corporate actions
  const deleteMut = useMutation({
    mutationFn: (caid: string) => deleteCorporateAction(id!, caid),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["stock", id] });
      queryClient.invalidateQueries({ queryKey: ["stock-prices", id] });
      setDeleteTarget(null);
      const rev = result.portfolioImpact;
      if (rev) {
        setCaImpactMessage(
          t("stockDetail.caRemoved", { count: rev.reversed ?? 0 }) +
            (rev.cashReversed ? t("stockDetail.caCashReversed", { amount: formatCurrency(rev.cashReversed) }) : "") +
            ".",
        );
      }
    },
    onError: () => setDeleteTarget(null),
  });

  function formatCaImpact(impact?: CorporateActionPortfolioImpact) {
    if (!impact) return null;
    const parts = [t("stockDetail.caApplied", { count: impact.portfoliosAffected ?? 0 })];
    if ((impact.totalQtyDelta ?? 0) !== 0) parts.push(t("stockDetail.caQtyDelta", { delta: impact.totalQtyDelta }));
    if ((impact.totalCashPosted ?? 0) !== 0) parts.push(t("stockDetail.caCashPosted", { amount: formatCurrency(impact.totalCashPosted!) }));
    return parts.join(" · ");
  }

  const setExactDateFilter = (value: string) => {
    setDateExact(value);
    if (value) {
      setDateFrom("");
      setDateTo("");
    }
    setPage(1);
  };

  const setRangeFromFilter = (value: string) => {
    setDateFrom(value);
    if (value) setDateExact("");
    setPage(1);
  };

  const setRangeToFilter = (value: string) => {
    setDateTo(value);
    if (value) setDateExact("");
    setPage(1);
  };

  const handleExport = async (mode: "filtered" | "all") => {
    if (!id) return;
    setExporting(mode);
    try {
      if (mode === "all") {
        await exportStockPrices(id, { all: true });
      } else {
        await exportStockPrices(id, {
          date: dateExact || undefined,
          from: dateFrom || undefined,
          to: dateTo || undefined,
        });
      }
    } catch {
      // keep silent; button state resets
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="cdp space-y-6 py-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-[19px] sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-[20px]" />
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-3xl" />
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </Shell>
    );
  }

  if (!stock) {
    return (
      <Shell>
        <div className="cdp">
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("stockDetail.notFoundTitle")}
            description={t("stockDetail.notFoundDesc")}
            action={<Button asChild><Link href="/stocks">{t("stockDetail.back")}</Link></Button>}
          />
        </div>
      </Shell>
    );
  }

  const priceHistory = (stock.priceHistory || []).sort((a, b) => a.date.localeCompare(b.date));
  const corporateActions = corporateActionsList;
  const adjustedPriceHistory = stock.adjustedPriceHistory || [];
  const totalReturnIndex = stock.totalReturnIndex || [];
  const metrics = stock.performanceMetrics;

  // Chart data filtered by time range
  const priceChartData = filterByDays(priceHistory.map((p) => ({ ...p })), timeRange);
  const adjChartData = filterByDays(adjustedPriceHistory, timeRange);
  const triChartData = filterByDays(totalReturnIndex, timeRange);

  return (
    <Shell>
      <div className="cdp">
      <Link
        href={portfolioId ? `/customers-old/${portfolioId}` : "/stocks"}
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        {portfolioId ? t("stockDetail.backToPortfolio") : t("stockDetail.back")}
      </Link>

      <header className="cdp-header">
        <div className="cdp-title">
          <h1>{stock.companyName}</h1>
          <p>{stock.ticker} · {stock.sector || t("stockDetail.unclassifiedSector")}</p>
        </div>
        <div className="cdp-header-actions">
          <span className="inline-flex h-10 items-center gap-2 rounded-[14px] border border-[#dfe6f6] bg-gradient-to-br from-white to-[#eef3fd] px-3 text-xs font-bold text-[#139366] shadow-[var(--cdp-shadow2)]">
            <i className="hco-live-dot ms-0" /> {stock.ticker}
          </span>
          <ChangeChip pct={stock.dayChangePct} />
          <span className="inline-flex h-10 items-center rounded-[14px] border border-[#dfe6f6] bg-gradient-to-br from-white to-[#eef3fd] px-3 font-data text-sm font-bold text-[#1a2b4c] shadow-[var(--cdp-shadow2)]">
            {formatCurrency(stock.latestPrice || 0)}
          </span>
        </div>
      </header>

      {stock.holdingInfo && (
        <StatsSummaryBar
          className="mb-6"
          ariaLabel={t("stockDetail.quantityHeld")}
          items={[
            {
              id: "qty",
              icon: "/layers.png",
              label: t("stockDetail.quantityHeld"),
              value: <AnimatedNumber value={stock.holdingInfo.quantity} format="integer" />,
              hint: t("stockDetail.openPosition"),
            },
            {
              id: "avg",
              icon: "/cash.png",
              label: t("stockDetail.avgBuyPrice"),
              value: <AnimatedNumber value={stock.holdingInfo.avgCost} format="currency" />,
              hint: t("stockDetail.wacNote"),
            },
            {
              id: "value",
              icon: "/finance.png",
              label: t("stockDetail.currentValue"),
              value: <AnimatedNumber value={stock.holdingInfo.currentValue} format="currency" />,
              hint: t("stockDetail.markedAtClose"),
            },
            {
              id: "pnl",
              icon: "/Unrealized P&L.png",
              label: t("stockDetail.gainLoss"),
              value: <AnimatedNumber value={stock.holdingInfo.gainLossValue} format="currency" signed />,
              hint: t("stockDetail.vsAvgCost"),
              valueClassName: stock.holdingInfo.gainLossPct >= 0 ? "text-[var(--color-positive)]" : "text-loss",
            },
          ]}
        />
      )}

      <ClassificationPanel stock={stock} onSaved={() => queryClient.invalidateQueries({ queryKey: ["stock", id] })} />

      {caImpactMessage && (
        <div className="cdp-warn mb-6 flex items-start justify-between gap-3">
          <p className="font-mono">{caImpactMessage}</p>
          <Button variant="ghost" size="sm" onClick={() => setCaImpactMessage(null)}>{t("common.dismiss")}</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="cdp-data">
        <CdpTabsList value={activeTab}>
          <TabsTrigger value="overview" className={CDP_TAB}>{t("stockDetail.tabOverview")}</TabsTrigger>
          <TabsTrigger value="corporate-actions" className={CDP_TAB}>{t("stockDetail.tabCorporateActions")}</TabsTrigger>
          <TabsTrigger value="performance" className={CDP_TAB}>{t("stockDetail.tabPerformance")}</TabsTrigger>
        </CdpTabsList>

        {/* =============================================================== */}
        {/* Overview Tab */}
        {/* =============================================================== */}
        <TabsContent value="overview" className="cdp-pane mt-0 space-y-4">
          <section className="cdp-sectors mx-0" aria-labelledby="raw-price-title">
            <header className="cdp-sectors-head flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="raw-price-title">{t("stockDetail.rawPriceHistory")}</h3>
                <p>{t("stockDetail.closingPrices", { ticker: stock.ticker, count: priceHistory.length })}</p>
              </div>
              <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            </header>
            {priceChartData.length > 0 ? (
              <div className="h-[360px] pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceChartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="stock-raw-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent-ink)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="var(--color-accent-ink)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--color-border-hairline)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-text-muted)"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => formatCurrency(val ?? 0)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "linear-gradient(145deg, #fff, #f0f4fd)",
                        borderColor: "rgba(119, 141, 198, 0.22)",
                        borderRadius: "12px",
                        boxShadow: "var(--cdp-shadow1)",
                      }}
                      itemStyle={{ fontFamily: "var(--font-mono)" }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      formatter={(value: number) => [formatCurrency(value), t("stockDetail.price")]}
                    />
                    <Area type="monotone" dataKey="price" stroke="none" fill="url(#stock-raw-fill)" tooltipType="none" />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-accent-ink)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: "var(--color-surface-elevated)", stroke: "var(--color-accent-ink)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title={t("stockDetail.noPriceHistory")} description={t("stockDetail.noPriceHistoryDesc")} />
            )}
          </section>

          <AppTable
            loading={pricesFetching}
            toolbar={
              <DataTableToolbar
                icon="/analytics.png"
                count={
                  <div className="min-w-0">
                    <span className="block truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">
                      {t("stockDetail.dataPoints", { count: pricesPage?.pagination.total ?? 0 })}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--shell-muted)]">
                      {t("stockDetail.dataPointsSub")}
                    </span>
                  </div>
                }
                countLoading={pricesFetching && !pricesPage}
                filterLabel={t("customers.filters")}
                filterCount={[dateExact, dateFrom, dateTo].filter(Boolean).length}
                filterPanel={
                  <>
                    <div className="grid gap-1">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                        {t("stockDetail.exact")}
                      </span>
                      <DatePicker value={dateExact} onChange={setExactDateFilter} className="font-mono text-sm" />
                    </div>
                    <div className="grid gap-1 col-span-2 max-[900px]:col-span-1">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                        {t("indexDetail.fromTo")}
                      </span>
                      <DateRangePicker
                        from={dateFrom}
                        to={dateTo}
                        onChange={({ from, to }) => {
                          setRangeFromFilter(from);
                          setRangeToFilter(to);
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      className="self-end"
                      onClick={() => {
                        setDateExact("");
                        setDateFrom("");
                        setDateTo("");
                        setPage(1);
                      }}
                      disabled={!dateExact && !dateFrom && !dateTo}
                    >
                      {t("common.clearFilters")}
                    </Button>
                  </>
                }
                actions={
                  <>
                    <Button size="sm" onClick={() => { setEditingPoint(null); setPointDialogOpen(true); }}>
                      <Plus className="w-4 h-4 me-2" /> {t("common.addDay")}
                    </Button>
                    <StockExcelUploadButton stockId={id!} onDone={refreshPrices} size="default" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("filtered")}
                      disabled={!!exporting || !pricesPage?.pagination.total || (!dateExact && !dateFrom && !dateTo)}
                    >
                      {exporting === "filtered" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ExcelIcon className="me-2 size-4" />}
                      {t("common.exportExcel")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport("all")} disabled={!!exporting}>
                      {exporting === "all" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <ExcelIcon className="me-2 size-4" />}
                      {t("common.exportAll")}
                    </Button>
                  </>
                }
              />
            }
            footer={
              <TablePageFooter
                total={pricesPage?.pagination.total ?? 0}
                page={pricesPage?.pagination.page ?? page}
                pageSize={pageSize}
                pageSizes={CLIENT_PAGE_SIZES}
                loading={pricesFetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            }
          >
                <TableHeader>
                  <TableRow className="clients-thead-row h-10">
                    <DataTableHead className="sticky start-0 bg-[#f4f7fd] ps-5">{t("common.date")}</DataTableHead>
                    <DataTableHead align="end">{t("common.openPrice")}</DataTableHead>
                    <DataTableHead align="end">{t("common.high")}</DataTableHead>
                    <DataTableHead align="end">{t("common.low")}</DataTableHead>
                    <DataTableHead align="end">{t("common.closePrice")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.share")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.ask")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.offer")}</DataTableHead>
                    <DataTableHead align="end">{t("common.volume")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.orders")}</DataTableHead>
                    <DataTableHead>{t("stockDetail.month")}</DataTableHead>
                    <DataTableHead align="end" className="pe-5">{t("common.actions")}</DataTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricesFetching && !pricesPage?.data.length ? (
                    <DataTableSkeletonRows cols={12} rows={pageSize} />
                  ) : !pricesPage?.data.length ? (
                    <DataTableEmpty colSpan={12} title={t("stockDetail.noDataPointsMatch")} description={t("stockDetail.noDataPointsMatchDesc")} />
                  ) : (
                    pricesPage.data.map((d) => (
                      <TableRow key={formatDateOnly(d.date)} className="clients-row">
                        <TableCell className="font-mono text-sm sticky start-0 bg-card">{formatDateOnly(d.date)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.openPrice)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.highPrice)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.lowPrice)}</TableCell>
                        <TableCell className="text-end font-data font-semibold text-sm cdp-col-price">
                          {formatNum(d.closePrice ?? d.price)}
                        </TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.sharePrice)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.ask)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatNum(d.offer)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatInt(d.volume)}</TableCell>
                        <TableCell className="text-end font-data text-sm">{formatInt(d.orderNum)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{d.month || "—"}</TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-[12px]"
                              aria-label={t("stockDetail.editPricePoint")}
                              onClick={() => { setEditingPoint(d); setPointDialogOpen(true); }}
                            >
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="cdp-delete"
                              aria-label={t("stockDetail.deletePricePoint")}
                              onClick={() => setDeletePriceDate(formatDateOnly(d.date))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </AppTable>
        </TabsContent>

        {/* =============================================================== */}
        {/* Corporate Actions Tab */}
        {/* =============================================================== */}
        <TabsContent value="corporate-actions" className="cdp-pane mt-0 space-y-4">
          <AppTable
            loading={caPaging.busy}
            toolbar={
              <DataTableToolbar
                icon="/layers.png"
                count={
                  <div className="min-w-0">
                    <span className="block truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">
                      {t("stockDetail.corporateActionsTitle", { count: corporateActions.length })}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--shell-muted)]">
                      {t("stockDetail.corporateActionsSub", { ticker: stock.ticker })}
                    </span>
                  </div>
                }
                actions={
                  <Button size="sm" onClick={() => { setEditingCa(null); setCaDialogOpen(true); }}>
                    <Plus className="w-4 h-4 me-2" /> {t("stockDetail.addCorporateAction")}
                  </Button>
                }
              />
            }
            footer={
              <TablePageFooter
                total={caPaging.total}
                page={caPaging.page}
                pageSize={caPaging.pageSize}
                pageSizes={caPaging.pageSizes}
                loading={caPaging.busy}
                onPageChange={caPaging.setPage}
                onPageSizeChange={caPaging.setPageSize}
              />
            }
          >
                <TableHeader>
                  <TableRow className="clients-thead-row h-10">
                    <DataTableHead className="ps-5">{t("stockDetail.actionDate")}</DataTableHead>
                    <DataTableHead>{t("stockDetail.actionType")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.ratio")}</DataTableHead>
                    <DataTableHead align="end">{t("stockDetail.cashAmount")}</DataTableHead>
                    <DataTableHead>{t("common.created")}</DataTableHead>
                    <DataTableHead align="end" className="pe-5">{t("common.actions")}</DataTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corporateActions.length === 0 ? (
                    <DataTableEmpty colSpan={6} title={t("stockDetail.noCorporateActions")} description={t("stockDetail.noCorporateActionsDesc")} />
                  ) : (
                    caPaging.paged.map((ca) => (
                      <TableRow key={ca.id} className="clients-row">
                        <TableCell className="font-mono text-sm">{ca.actionDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              ca.actionType === "DIVIDEND"
                                ? "text-amber-500 border-amber-500/20"
                                : ca.actionType === "STOCK_SPLIT"
                                  ? "text-blue-500 border-blue-500/20"
                                  : "text-emerald-500 border-emerald-500/20"
                            }
                          >
                            {ca.actionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-mono text-sm">
                          {ca.ratio !== null ? ca.ratio.toFixed(6) : "—"}
                        </TableCell>
                        <TableCell className="text-end font-mono text-sm cdp-col-mv">
                          {ca.cashAmount !== null ? formatCurrency(ca.cashAmount) : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(ca.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-[12px]"
                              aria-label={t("stockDetail.editCorporateActionAria")}
                              onClick={() => {
                                setEditingCa(ca);
                                setCaDialogOpen(true);
                              }}
                            >
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="cdp-delete"
                              aria-label={t("stockDetail.deleteCorporateActionAria")}
                              onClick={() => setDeleteTarget(ca)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </AppTable>
        </TabsContent>

        <TabsContent value="performance" className="cdp-pane mt-0 space-y-4">
          <StatsSummaryBar
            className="mb-2"
            ariaLabel={t("stockDetail.tabPerformance")}
            items={[
              perfMetric("raw", "/analytics.png", t("stockDetail.rawClose"), metrics?.rawClose, "currency", t("common.nA")),
              perfMetric("adj", "/layers.png", t("stockDetail.adjClose"), metrics?.adjustedClose, "currency", t("common.nA")),
              perfMetric("daily", "/Daily P&L.png", t("stockDetail.dailyReturn"), metrics?.dailyReturn, "pct", t("common.nA")),
              perfMetric("monthly", "/growth.png", t("stockDetail.monthlyReturn"), metrics?.monthlyReturn, "pct", t("common.nA")),
              perfMetric("ytd", "/chart.png", t("stockDetail.ytdReturn"), metrics?.ytdReturn, "pct", t("common.nA")),
              perfMetric("annual", "/finance.png", t("stockDetail.annualReturn"), metrics?.annualReturn, "pct", t("common.nA")),
              perfMetric("inception", "/liquid.png", t("stockDetail.sinceInception"), metrics?.sinceInceptionReturn, "pct", t("common.nA")),
            ]}
          />

          <section className="cdp-sectors mx-0" aria-labelledby="adj-price-title">
            <header className="cdp-sectors-head flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="adj-price-title">{t("stockDetail.adjustedPriceHistory")}</h3>
                <p>{t("stockDetail.adjustedPriceHistorySub", { count: adjustedPriceHistory.length })}</p>
              </div>
              <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            </header>
            {adjChartData.length > 0 ? (
              <div className="h-[320px] pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={adjChartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--color-border-hairline)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-text-muted)"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => formatCurrency(val ?? 0)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "linear-gradient(145deg, #fff, #f0f4fd)",
                        borderColor: "rgba(119, 141, 198, 0.22)",
                        borderRadius: "12px",
                        boxShadow: "var(--cdp-shadow1)",
                      }}
                      itemStyle={{ fontFamily: "var(--font-mono)" }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      formatter={(value: number, name: string) => [formatCurrency(value), name === "adjustedClose" ? t("stockDetail.adjClose") : t("stockDetail.rawClose")]}
                    />
                    <Line
                      type="monotone"
                      dataKey="rawClose"
                      stroke="var(--color-text-muted)"
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      name="rawClose"
                    />
                    <Line
                      type="monotone"
                      dataKey="adjustedClose"
                      stroke="var(--color-accent-ink)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: "var(--color-surface-elevated)", stroke: "var(--color-accent-ink)", strokeWidth: 2 }}
                      name="adjustedClose"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title={t("stockDetail.noAdjustedPrice")}
                description={t("stockDetail.noAdjustedPriceDesc")}
              />
            )}
          </section>

          <section className="cdp-sectors mx-0" aria-labelledby="tri-title">
            <header className="cdp-sectors-head flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 id="tri-title">{t("stockDetail.triTitle")}</h3>
                <p>{t("stockDetail.triSub")}</p>
              </div>
              <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            </header>
            {triChartData.length > 0 ? (
              <div className="h-[320px] pt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={triChartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="stock-tri-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(152, 69%, 51%)" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="hsl(152, 69%, 51%)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--color-border-hairline)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-text-muted)"
                      fontSize={11}
                      fontFamily="var(--font-mono)"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => val.toFixed(0)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "linear-gradient(145deg, #fff, #f0f4fd)",
                        borderColor: "rgba(119, 141, 198, 0.22)",
                        borderRadius: "12px",
                        boxShadow: "var(--cdp-shadow1)",
                      }}
                      itemStyle={{ fontFamily: "var(--font-mono)" }}
                      labelFormatter={(val) => new Date(val).toLocaleDateString()}
                      formatter={(value: number) => [value.toFixed(2), t("stockDetail.tri")]}
                    />
                    <Area type="monotone" dataKey="tri" stroke="none" fill="url(#stock-tri-fill)" tooltipType="none" />
                    <Line
                      type="monotone"
                      dataKey="tri"
                      stroke="hsl(152, 69%, 51%)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: "var(--color-surface-elevated)", stroke: "hsl(152, 69%, 51%)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title={t("stockDetail.noTri")}
                description={t("stockDetail.noTriDesc")}
              />
            )}
          </section>
        </TabsContent>
      </Tabs>
      </div>

      {/* --- Dialogs --- */}
      <CorporateActionDialog
        open={caDialogOpen}
        onOpenChange={setCaDialogOpen}
        stockId={id!}
        ticker={stock.ticker}
        editCa={editingCa}
        onSuccess={(impact) => {
          queryClient.invalidateQueries({ queryKey: ["stock", id] });
          const msg = formatCaImpact(impact);
          if (msg) setCaImpactMessage(msg);
        }}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget ? t("stockDetail.itemCa", { type: deleteTarget.actionType, date: deleteTarget.actionDate }) : ""}
        description={t("stockDetail.deleteCaDesc")}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        isPending={deleteMut.isPending}
      />

      <StockPricePointDialog
        open={pointDialogOpen}
        onOpenChange={(v) => { setPointDialogOpen(v); if (!v) setEditingPoint(null); }}
        stockId={id!}
        editPoint={editingPoint}
        onSaved={refreshPrices}
      />

      <ConfirmDeleteDialog
        open={!!deletePriceDate}
        onOpenChange={(v) => { if (!v) setDeletePriceDate(null); }}
        itemName={deletePriceDate ? t("stockDetail.itemPriceOn", { date: deletePriceDate }) : ""}
        description={t("stockDetail.deletePriceDesc")}
        onConfirm={() => { if (deletePriceDate) deletePriceMut.mutate(deletePriceDate); }}
        isPending={deletePriceMut.isPending}
      />
    </Shell>
  );
}
