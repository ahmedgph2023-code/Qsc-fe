import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/layout/Shell";
import { getStocks, createStock, deleteStock, downloadStockTemplate, downloadBulkStockTemplate, bulkUploadStocks, updateStockClassification, type StockData } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { StockExcelUploadButton } from "@/components/StockPricePointDialog";
import { ExcelIcon } from "@/components/phase1/ExportFormatIcons";
import { Plus, Trash2, Loader2, Check, Building2, Tags } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { QuoteBoard, quoteLogoLabel } from "@/components/phase1/QuoteBoard";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { SelectField } from "@/components/phase1/SelectField";
import { shariahGroupLabel, normalizeShariahGroup } from "@/lib/mandatePreview";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";

function AddStockDialog({ stocks, queryClient }: { stocks: StockData[]; queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "upload">("create");
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [shariahGroup, setShariahGroup] = useState("");
  const [regulatoryStatus, setRegulatoryStatus] = useState("clear");
  const [uploadStockId, setUploadStockId] = useState("");

  const createMut = useMutation({
    mutationFn: () => createStock({
      ticker,
      companyName,
      sector,
      shariahGroup: shariahGroup || undefined,
      regulatoryStatus,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setTicker(""); setCompanyName(""); setSector(""); setShariahGroup(""); setRegulatoryStatus("clear");
    },
  });

  if (!canPerformAction("stock.mutate", { role, username })) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setTab("create"); setTicker(""); setCompanyName(""); setSector(""); } }}>
      <DialogTrigger asChild>
        <Button className="cdp-add"><Plus className="w-4 h-4 me-2" /> {t("stocks.addStock")}</Button>
      </DialogTrigger>
      <DialogContent className="cdp-modal sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("stocks.addNew")}</DialogTitle>
          <DialogDescription>{t("stocks.addStockDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex border-b border-border mb-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTab("create")}
            className={`h-auto flex-1 rounded-none border-b-2 -mb-[1px] py-2.5 ${tab === "create" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Building2 className="w-4 h-4" /> {t("stocks.createStock")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setTab("upload")}
            className={`h-auto flex-1 rounded-none border-b-2 -mb-[1px] py-2.5 ${tab === "upload" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <ExcelIcon className="me-2 size-4" /> {t("stocks.uploadPrices")}
          </Button>
        </div>

        <div className="py-2">
          {tab === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("common.ticker")}</Label>
                <Input placeholder="QNBK" value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("common.companyName")}</Label>
                <Input placeholder={t("stocks.companyPlaceholder")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("common.sector")}</Label>
                <Input placeholder={t("stocks.sectorPlaceholder")} value={sector} onChange={(e) => setSector(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-mono">{t("common.shariah")}</Label>
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
                  <Label className="text-xs uppercase font-mono">{t("common.regulatory")}</Label>
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
              </div>
              <Button className="w-full" onClick={() => createMut.mutate()} disabled={!ticker || !companyName || !sector || createMut.isPending}>
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
                {t("stocks.createStockBtn")}
              </Button>
              {createMut.isError && <p className="text-sm text-rose-500 font-mono">{(createMut.error as Error).message}</p>}
              {createMut.isSuccess && <p className="text-sm text-emerald-500 font-mono flex items-center gap-1"><Check className="w-3 h-3" /> {t("common.created")}</p>}
            </div>
          )}
          {tab === "upload" && (
            <div className="space-y-4">
              <Button variant="outline" size="sm" className="w-full" onClick={() => downloadStockTemplate()}>
                <ExcelIcon className="me-2 size-4" /> {t("common.downloadTemplate")}
              </Button>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("stocks.targetStock")}</Label>
                <SelectField
                  className="w-full font-mono"
                  value={uploadStockId}
                  onValueChange={setUploadStockId}
                  placeholder={t("common.selectStock")}
                  options={[{ value: "", label: t("common.selectStock") }, ...stocks.map((s) => ({ value: s.id, label: `${s.ticker} — ${s.companyName}` }))]}
                />
              </div>
              {uploadStockId ? (
                <StockExcelUploadButton
                  stockId={uploadStockId}
                  size="default"
                  label={t("stocks.uploadPreview")}
                  onDone={() => {
                    queryClient.invalidateQueries({ queryKey: ["stocks"] });
                    queryClient.invalidateQueries({ queryKey: ["stock", uploadStockId] });
                    queryClient.invalidateQueries({ queryKey: ["stock-prices", uploadStockId] });
                    setOpen(false);
                  }}
                />
              ) : (
                <p className="text-xs text-muted-foreground">{t("stocks.selectStockHint")}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BulkStockUploadDialog({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ count: number; stocksCreated: number; stocksFound: number; tickers: string[] } | null>(null);

  const uploadMut = useMutation({
    mutationFn: () => bulkUploadStocks(uploadFile!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setResult(data);
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  if (!canPerformAction("stock.mutate", { role, username })) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="cdp-upload"><ExcelIcon className="me-2 size-4" /> {t("stocks.bulkUploadBtn")}</Button>
      </DialogTrigger>
      <DialogContent className="cdp-modal sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("stocks.bulkUpload")}</DialogTitle>
          <DialogDescription>{t("stocks.bulkUploadDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => downloadBulkStockTemplate()}>
            <ExcelIcon className="me-2 size-4" /> {t("common.downloadTemplate")}
          </Button>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("stocks.excelFile")}</Label>
            <Input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          </div>
          <Button className="w-full" onClick={() => uploadMut.mutate()} disabled={!uploadFile || uploadMut.isPending}>
            {uploadMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <ExcelIcon className="me-2 size-4" />}
            {t("stocks.uploadProcess")}
          </Button>
          {uploadMut.isError && <p className="text-sm text-rose-500 font-mono">{(uploadMut.error as Error).message}</p>}
          {result && (
            <div className="bg-muted/50 p-4 rounded space-y-2 text-sm">
              <p className="font-bold text-emerald-500">{t("stocks.processedRows", { count: result.count })}</p>
              {result.stocksCreated > 0 && (
                <p className="text-emerald-500 font-mono text-xs">
                  {t("stocks.newTickersCreated", { count: result.stocksCreated, tickers: result.tickers.join(", ") })}
                </p>
              )}
              <p className="text-muted-foreground font-mono text-xs">{t("stocks.existingMatched", { count: result.stocksFound })}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Stocks() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [illiquidOnly, setIlliquidOnly] = useState(false);
  const [restrictedOnly, setRestrictedOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [classifyRows, setClassifyRows] = useState<{ id: string; ticker: string; shariahGroup: string; regulatoryStatus: string }[]>([]);
  const queryClient = useQueryClient();
  const { role, username } = useAuth();
  const canMutateStock = canPerformAction("stock.mutate", { role, username });
  const canDeleteStock = canPerformAction("stock.delete", { role, username });
  const { data: stocks = [], isLoading } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteStock(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stocks"] }); setDeleteTarget(null); },
  });
  const classifyMut = useMutation({
    mutationFn: async () => {
      for (const row of classifyRows) {
        await updateStockClassification(row.id, {
          shariahGroup: row.shariahGroup || null,
          regulatoryStatus: row.regulatoryStatus || "clear",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      setClassifyOpen(false);
    },
  });

  const filtered = stocks.filter((s: StockData) => {
    const hay = `${s.companyName || ""} ${s.ticker || ""} ${s.sector || ""}`.toLowerCase();
    if (!hay.includes(search.toLowerCase())) return false;
    if (groupFilter === "unclassified" && normalizeShariahGroup(s.shariahGroup)) return false;
    if (groupFilter && groupFilter !== "unclassified" && normalizeShariahGroup(s.shariahGroup) !== groupFilter) return false;
    if (illiquidOnly && !s.isIlliquid) return false;
    if (restrictedOnly && !(s.regulatoryStatus === "restricted" || s.regulatoryStatus === "suspended" || s.isTradable === false)) return false;
    return true;
  });

  const openClassify = () => {
    setClassifyRows(
      stocks.slice(0, 40).map((s) => ({
        id: s.id,
        ticker: s.ticker,
        shariahGroup: normalizeShariahGroup(s.shariahGroup) || "",
        regulatoryStatus: s.regulatoryStatus || "clear",
      })),
    );
    setClassifyOpen(true);
  };

  const advancing = stocks.filter((s) => (s.dayChangePct || 0) >= 0).length;
  const declining = stocks.length - advancing;
  const illiquidCount = stocks.filter((s) => s.isIlliquid).length;
  const restrictedCount = stocks.filter((s) =>
    s.regulatoryStatus === "restricted" || s.regulatoryStatus === "suspended" || s.isTradable === false,
  ).length;

  return (
    <Shell>
      <div className="cdp">
        <header className="cdp-header">
          <div className="cdp-title">
            <h1>{t("stocks.title")}</h1>
            <p>{t("stocks.description")}</p>
          </div>
          <div className="cdp-header-actions">
            <AddStockDialog stocks={stocks} queryClient={queryClient} />
            <BulkStockUploadDialog queryClient={queryClient} />
            {canMutateStock ? (
              <Button variant="outline" className="cdp-ghost-action" onClick={openClassify}>
                <Tags className="me-2 h-4 w-4" /> {t("common.classify")}
              </Button>
            ) : null}
          </div>
        </header>

        <StatsSummaryBar
          className="mt-6"
          ariaLabel={t("stocks.names")}
          loading={isLoading}
          items={[
            {
              id: "names",
              icon: "/analytics.png",
              label: t("stocks.names"),
              value: <AnimatedNumber value={stocks.length} format="integer" />,
              hint: t("stocks.namesNote"),
            },
            {
              id: "advancing",
              icon: "/growth.png",
              label: t("stocks.advancing"),
              value: <AnimatedNumber value={advancing} format="integer" />,
              hint: t("stocks.decliningNote", { count: declining }),
              valueClassName: "text-[var(--color-positive)]",
            },
            {
              id: "illiquid",
              icon: "/liquid.png",
              label: t("stocks.illiquid"),
              value: <AnimatedNumber value={illiquidCount} format="integer" />,
              hint: t("stocks.adtvFlag"),
            },
            {
              id: "restricted",
              icon: "/security.png",
              label: t("stocks.restricted"),
              value: <AnimatedNumber value={restrictedCount} format="integer" />,
              hint: t("stocks.regulatoryOrNotTradable"),
            },
          ]}
        />

        <QuoteBoard
          className="mt-6"
          title={t("stocks.marketNames")}
          subtitle={t("stocks.marketNamesSub")}
          icon="/analytics.png"
          loading={isLoading}
          emptyTitle={t("stocks.emptyTitle")}
          emptyDescription={t("stocks.emptyDesc")}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("stocks.searchPlaceholder")}
          searchLabel={t("stocks.searchPlaceholder")}
          hotkey
          filterLabel={t("customers.filters")}
          filterCount={[groupFilter, illiquidOnly, restrictedOnly].filter(Boolean).length}
          filterPanel={
            <>
              <div className="grid gap-1">
                <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                  {t("common.shariah")}
                </span>
                <SelectField
                  className="w-full"
                  contentClassName="clients-select-content"
                  value={groupFilter}
                  onValueChange={setGroupFilter}
                  aria-label={t("stocks.allClassifications")}
                  options={[
                    { value: "", label: t("stocks.allClassifications") },
                    { value: "shariah", label: t("common.shariah") },
                    { value: "not_shariah", label: t("common.notShariah") },
                    { value: "unclassified", label: t("stocks.unclassified") },
                  ]}
                />
              </div>
              <div className="grid gap-1">
                <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                  {t("stocks.illiquid")}
                </span>
                <SelectField
                  className="w-full"
                  contentClassName="clients-select-content"
                  value={illiquidOnly ? "1" : ""}
                  onValueChange={(v) => setIlliquidOnly(v === "1")}
                  aria-label={t("stocks.illiquid")}
                  options={[
                    { value: "", label: t("common.all") },
                    { value: "1", label: t("stocks.illiquid") },
                  ]}
                />
              </div>
              <div className="grid gap-1">
                <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                  {t("stocks.restricted")}
                </span>
                <SelectField
                  className="w-full"
                  contentClassName="clients-select-content"
                  value={restrictedOnly ? "1" : ""}
                  onValueChange={(v) => setRestrictedOnly(v === "1")}
                  aria-label={t("stocks.restricted")}
                  options={[
                    { value: "", label: t("common.all") },
                    { value: "1", label: t("stocks.restricted") },
                  ]}
                />
              </div>
            </>
          }
          rows={filtered.map((s: StockData) => {
            const flags = [
              s.isIlliquid ? t("stocks.illiquid") : null,
              s.regulatoryStatus && s.regulatoryStatus !== "clear" ? s.regulatoryStatus : null,
              s.isTradable === false ? t("stocks.restricted") : null,
            ].filter(Boolean) as string[];
            const metaParts = [
              s.sector || t("common.na"),
              s.shariahGroup ? shariahGroupLabel(s.shariahGroup) : t("common.na"),
              flags.length ? flags.join(" · ") : null,
            ].filter(Boolean);
            return {
              id: s.id,
              href: `/stocks/${s.id}`,
              logo: quoteLogoLabel(s.ticker),
              title: s.ticker,
              subtitle: s.companyName,
              meta: metaParts.join(" · "),
              sparkline: s.sparkline || [],
              price: Number(s.currentPrice || 0).toFixed(2),
              priceCaption: t("common.currencyValue"),
              dayPct: s.dayChangePct,
              actions: canDeleteStock ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="cdp-delete"
                  aria-label={t("stocks.deleteAria", { ticker: s.ticker })}
                  onClick={() => setDeleteTarget({ id: s.id, name: s.ticker })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null,
            };
          })}
        />
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        isPending={deleteMut.isPending}
      />

      <Dialog open={classifyOpen} onOpenChange={setClassifyOpen}>
        <DialogContent className="cdp-modal sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t("stocks.bulkClassification")}</DialogTitle>
            <DialogDescription>{t("stocks.classifyDesc")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {classifyRows.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[80px_1fr_1fr] gap-2">
                <p className="flex h-10 items-center font-mono text-sm">{row.ticker}</p>
                <SelectField
                  className="control"
                  value={normalizeShariahGroup(row.shariahGroup) || ""}
                  onValueChange={(v) => setClassifyRows(classifyRows.map((r, n) => n === i ? { ...r, shariahGroup: v } : r))}
                  options={[
                    { value: "", label: t("stocks.unclassified") },
                    { value: "shariah", label: t("common.shariah") },
                    { value: "not_shariah", label: t("common.notShariah") },
                  ]}
                />
                <SelectField
                  className="control"
                  value={row.regulatoryStatus}
                  onValueChange={(v) => setClassifyRows(classifyRows.map((r, n) => n === i ? { ...r, regulatoryStatus: v } : r))}
                  options={[
                    { value: "clear", label: t("stocks.regulatoryClear") },
                    { value: "watch", label: t("stocks.watch") },
                    { value: "restricted", label: t("stocks.restricted") },
                    { value: "suspended", label: t("stocks.suspended") },
                  ]}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClassifyOpen(false)}>{t("common.cancel")}</Button>
            <Button disabled={classifyMut.isPending} onClick={() => classifyMut.mutate()}>
              {classifyMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("stocks.saveClassifications")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
