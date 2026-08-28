import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getStocks,
  getIndexConstituentsHistory,
  setIndexConstituents,
  deleteIndexConstituentsSnapshot,
  type IndexData,
  type StockData,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/phase1/SelectField";
import { DatePicker } from "@/components/phase1/DatePicker";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  AppTable,
  ClientTableFooter,
  DataTableEmpty,
  DataTableHead,
  DataTableToolbar,
  useClientTablePage,
} from "@/components/phase1/DataTableCard";
import { Layers, Loader2, Check, ChevronDown, ChevronRight, Trash2, PenLine, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

/** Content well: 16 + 260 sidebar + 16 gap + 20 end pad. Portal is outside Shell vars. */
const SHEET_CLASS =
  "!inset-y-3 !start-auto !end-5 !h-[calc(100vh-1.5rem)] !max-h-none !min-h-0 !overflow-y-auto !gap-3 !p-4 sm:!p-5 " +
  "!w-[min(72rem,calc(100vw-1.5rem))] !max-w-6xl " +
  "md:!w-[min(72rem,calc(100vw-312px))] md:!max-w-[min(72rem,calc(100vw-312px))]";

type Props = {
  indices?: IndexData[];
  /** Lock manager to one index (detail page / card). */
  fixedIndexId?: string;
  fixedIndexName?: string;
  /** When opening, load this snapshot into the editor. */
  initialEffectiveDate?: string | null;
  /** Controlled open (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger button label / variant. */
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "icon";
  /** Hide the default trigger (use controlled open only). */
  hideTrigger?: boolean;
  className?: string;
};

export function IndexConstituentsDialog({
  indices = [],
  fixedIndexId,
  fixedIndexName,
  initialEffectiveDate = null,
  open: controlledOpen,
  onOpenChange,
  triggerLabel,
  triggerVariant = "outline",
  triggerSize = "default",
  hideTrigger = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolledOpen(v);
  };

  const [indexId, setIndexId] = useState(fixedIndexId || "");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [tickerFilter, setTickerFilter] = useState("");
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [prefilledFrom, setPrefilledFrom] = useState<string | null>(null);
  const [editingExisting, setEditingExisting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    if (fixedIndexId) setIndexId(fixedIndexId);
  }, [fixedIndexId, open]);

  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const sortedStocks = useMemo(
    () => [...stocks].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [stocks]
  );

  const { data: history, isFetching: historyLoading } = useQuery({
    queryKey: ["index-constituents", indexId],
    queryFn: () => getIndexConstituentsHistory(indexId),
    enabled: !!indexId && open,
  });

  const snapshots = history?.snapshots || [];

  useEffect(() => {
    if (!open || !indexId || !sortedStocks.length) return;
    const preferred = initialEffectiveDate && snapshots.some((s) => s.effectiveDate === initialEffectiveDate)
      ? initialEffectiveDate
      : null;
    const sourceDate = preferred || snapshots[0]?.effectiveDate;
    const key = `${indexId}:${sourceDate || "empty"}:${initialEffectiveDate || "new"}`;
    if (hydratedKey === key) return;
    const source = sourceDate
      ? snapshots.find((s) => s.effectiveDate === sourceDate)
      : undefined;
    const next: Record<string, string> = {};
    for (const s of sortedStocks) next[s.id] = "";
    if (source) {
      for (const c of source.constituents) next[c.stockId] = String(c.weightPct);
      setPrefilledFrom(source.effectiveDate);
      setExpandedDate(source.effectiveDate);
    } else {
      setPrefilledFrom(null);
    }
    if (preferred) {
      setEffectiveDate(preferred);
      setEditingExisting(true);
    } else {
      setEffectiveDate(new Date().toISOString().slice(0, 10));
      setEditingExisting(false);
    }
    setWeights(next);
    setHydratedKey(key);
  }, [open, indexId, sortedStocks, snapshots, hydratedKey, initialEffectiveDate]);

  const totalPct = useMemo(() => {
    return Object.values(weights).reduce((sum, raw) => {
      const n = Number(raw);
      return sum + (Number.isFinite(n) && n > 0 ? n : 0);
    }, 0);
  }, [weights]);

  const totalOk = Math.abs(totalPct - 100) <= 0.01;
  const memberCount = Object.values(weights).filter((w) => Number(w) > 0).length;

  const filteredStocks = useMemo(() => {
    const q = tickerFilter.trim().toLowerCase();
    if (!q) return sortedStocks;
    return sortedStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        (s.sector || "").toLowerCase().includes(q)
    );
  }, [sortedStocks, tickerFilter]);
  const paging = useClientTablePage(filteredStocks, tickerFilter);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["index-reference"] });
    queryClient.invalidateQueries({ queryKey: ["index-constituents", indexId] });
    queryClient.invalidateQueries({ queryKey: ["indices"] });
    queryClient.invalidateQueries({ queryKey: ["stocks"] });
    queryClient.invalidateQueries({ queryKey: ["stock"] });
  };

  const saveMut = useMutation({
    mutationFn: () =>
      setIndexConstituents(indexId, {
        effectiveDate,
        constituents: sortedStocks
          .map((s) => ({ stockId: s.id, weight: Number(weights[s.id] || 0) }))
          .filter((c) => c.weight > 0),
      }),
    onSuccess: () => {
      invalidate();
      setHydratedKey(null);
      setEditingExisting(true);
      setPrefilledFrom(effectiveDate);
      setExpandedDate(effectiveDate);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (date: string) => deleteIndexConstituentsSnapshot(indexId, date),
    onSuccess: (_data, date) => {
      invalidate();
      setDeleteTarget(null);
      setHydratedKey(null);
      if (effectiveDate === date) {
        setEffectiveDate(new Date().toISOString().slice(0, 10));
        setEditingExisting(false);
      }
    },
  });

  const applySnapshot = (effective: string, mode: "edit" | "view" = "edit") => {
    const snap = snapshots.find((s) => s.effectiveDate === effective);
    if (!snap) return;
    const next: Record<string, string> = {};
    for (const s of sortedStocks) next[s.id] = "";
    for (const c of snap.constituents) next[c.stockId] = String(c.weightPct);
    setWeights(next);
    setEffectiveDate(effective);
    setPrefilledFrom(effective);
    setExpandedDate(effective);
    setEditingExisting(mode === "edit");
  };

  const startNewSnapshot = () => {
    const next: Record<string, string> = {};
    for (const s of sortedStocks) next[s.id] = "";
    setWeights(next);
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setPrefilledFrom(null);
    setEditingExisting(false);
  };

  const resetOnClose = () => {
    if (!fixedIndexId) setIndexId("");
    setTickerFilter("");
    setWeights({});
    setExpandedDate(null);
    setPrefilledFrom(null);
    setEditingExisting(false);
    setHydratedKey(null);
    setDeleteTarget(null);
    saveMut.reset();
  };

  const titleName = fixedIndexName || indices.find((i) => i.id === indexId)?.name;
  const resolvedTriggerLabel = triggerLabel ?? t("dialogs.indexConstituents.trigger");

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetOnClose();
        }}
      >
        {!hideTrigger && (
          <DialogTrigger asChild>
            <Button variant={triggerVariant} size={triggerSize} className={className}>
              {triggerSize === "icon" ? (
                <Layers className="h-3.5 w-3.5" />
              ) : (
                <>
                  <Layers className="w-4 h-4 me-2" /> {resolvedTriggerLabel}
                </>
              )}
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className={SHEET_CLASS}>
          <DialogHeader className="shrink-0">
            <DialogTitle>
              {titleName
                ? t("dialogs.indexConstituents.titleNamed", { name: titleName })
                : t("dialogs.indexConstituents.title")}
            </DialogTitle>
            <DialogDescription>
              {t("dialogs.indexConstituents.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(240px,38%)] gap-4 md:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] md:grid-rows-[minmax(0,1fr)]">
            <div className="flex h-full min-h-0 min-w-0 flex-col gap-3">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {!fixedIndexId && (
                  <SelectField
                    className="w-[min(100%,16rem)] shrink-0"
                    value={indexId}
                    onValueChange={(v) => {
                      setIndexId(v);
                      setHydratedKey(null);
                    }}
                    placeholder={t("dialogs.indexConstituents.select")}
                    options={[{ value: "", label: t("dialogs.indexConstituents.select") }, ...indices.map((idx) => ({ value: idx.id, label: idx.name }))]}
                  />
                )}
                <DatePicker
                  className="w-[min(100%,16rem)] shrink-0"
                  prefix={t("dialogs.indexConstituents.effectiveDate")}
                  value={effectiveDate}
                  onChange={(iso) => {
                    setEffectiveDate(iso);
                    setEditingExisting(snapshots.some((s) => s.effectiveDate === iso));
                  }}
                />
                {indexId ? (
                  <Button type="button" size="sm" variant="secondary" onClick={startNewSnapshot}>
                    <Plus className="w-3.5 h-3.5 me-1" /> {t("dialogs.indexConstituents.newSnapshot")}
                  </Button>
                ) : null}
                {editingExisting ? (
                  <Badge className="font-mono">{t("dialogs.indexConstituents.editingDate", { date: effectiveDate })}</Badge>
                ) : prefilledFrom ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {t("dialogs.indexConstituents.prefillFrom", { date: prefilledFrom })}
                  </span>
                ) : null}
              </div>

              {indexId ? (
                <>
                  <AppTable
                    className="flex min-h-0 flex-1 flex-col !overflow-visible"
                    wrapClassName="min-h-0 flex-1 basis-0 overflow-y-auto overflow-x-auto"
                    toolbar={
                      <DataTableToolbar
                        icon="/layers.png"
                        count={t("dialogs.indexConstituents.membersCount", { count: memberCount })}
                        search={tickerFilter}
                        onSearchChange={setTickerFilter}
                        searchPlaceholder={t("dialogs.indexConstituents.filterTickers")}
                        searchLabel={t("dialogs.indexConstituents.filterTickers")}
                        actions={
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono",
                              totalOk ? "border-emerald-500/40 text-emerald-500" : "border-rose-500/40 text-rose-500",
                            )}
                          >
                            {t("dialogs.indexConstituents.totalPct", { pct: totalPct.toFixed(2) })}
                          </Badge>
                        }
                      />
                    }
                    footer={<ClientTableFooter paging={paging} />}
                  >
                    <TableHeader>
                      <TableRow className="clients-thead-row h-10">
                        <DataTableHead className="ps-5">{t("common.ticker")}</DataTableHead>
                        <DataTableHead>{t("common.company")}</DataTableHead>
                        <DataTableHead>{t("common.sector")}</DataTableHead>
                        <DataTableHead align="end" className="w-32 pe-5">{t("dialogs.indexConstituents.weightPct")}</DataTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paging.paged.length === 0 ? (
                        <DataTableEmpty colSpan={4} title={t("common.noData")} />
                      ) : paging.paged.map((s: StockData) => {
                        const w = weights[s.id] ?? "";
                        const active = Number(w) > 0;
                        return (
                          <TableRow key={s.id} className={cn("clients-row", active && "bg-primary/5")}>
                            <TableCell className="ps-5 font-mono text-sm font-semibold">{s.ticker}</TableCell>
                            <TableCell className="max-w-[220px] truncate text-sm">{s.companyName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.sector}</TableCell>
                            <TableCell className="pe-5 text-end">
                              <Input
                                className="ms-auto h-8 w-[5.5rem] px-2 text-end font-mono text-sm"
                                inputMode="decimal"
                                placeholder="0"
                                value={w}
                                onChange={(e) =>
                                  setWeights((prev) => ({ ...prev, [s.id]: e.target.value }))
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </AppTable>

                  <DialogFooter className="mt-0 shrink-0 flex-col gap-1.5 sm:flex-col sm:justify-stretch">
                    <Button
                      size="block"
                      disabled={!indexId || !effectiveDate || !totalOk || memberCount === 0 || saveMut.isPending}
                      onClick={() => saveMut.mutate()}
                    >
                      {saveMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                      {editingExisting
                        ? t("dialogs.indexConstituents.updateSnapshot", { date: effectiveDate })
                        : t("dialogs.indexConstituents.saveSnapshot", { date: effectiveDate })}
                    </Button>
                    {!totalOk && memberCount > 0 && (
                      <p className="text-center font-mono text-xs text-rose-500">
                        {t("dialogs.indexConstituents.totalMustBe100", { pct: totalPct.toFixed(2) })}
                      </p>
                    )}
                    {saveMut.isError && (
                      <p className="font-mono text-sm text-rose-500">{(saveMut.error as Error).message}</p>
                    )}
                    {saveMut.isSuccess && (
                      <p className="flex items-center justify-center gap-1 font-mono text-sm text-emerald-500">
                        <Check className="h-3 w-3" /> {t("dialogs.indexConstituents.savedFor", { date: effectiveDate })}
                      </p>
                    )}
                  </DialogFooter>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-[16px] border border-dashed border-[#dbe3ed] text-sm text-muted-foreground">
                  {t("dialogs.indexConstituents.selectIndexHint")}
                </div>
              )}
            </div>

            <aside className="clients-table-card flex h-full min-h-0 flex-col max-md:min-h-[280px]">
              <div className="clients-table-toolbar shrink-0">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[var(--shell-muted)]">
                    {t("dialogs.indexConstituents.history")}
                  </p>
                  <p className="text-sm font-bold text-[var(--shell-ink)]">{t("dialogs.indexConstituents.newestFirst")}</p>
                </div>
              </div>
              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col gap-2 p-3",
                  expandedDate ? "overflow-hidden" : "overflow-auto",
                )}
              >
                {!indexId && (
                  <p className="p-2 text-xs text-muted-foreground">{t("dialogs.indexConstituents.chooseIndexSnapshots")}</p>
                )}
                {indexId && historyLoading && (
                  <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("common.loading")}
                  </div>
                )}
                {indexId && !historyLoading && snapshots.length === 0 && (
                  <p className="p-2 text-xs text-muted-foreground">{t("dialogs.indexConstituents.noHistory")}</p>
                )}
                {snapshots.map((snap) => {
                  const openSnap = expandedDate === snap.effectiveDate;
                  return (
                    <div
                      key={snap.effectiveDate}
                      className={cn(
                        "overflow-hidden rounded-[16px] border border-[#e4ebf8] bg-white/80 dark:border-white/10 dark:bg-white/5",
                        openSnap && "flex min-h-0 flex-1 flex-col",
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-start hover:bg-muted/40"
                        onClick={() => setExpandedDate(openSnap ? null : snap.effectiveDate)}
                      >
                        {openSnap ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-semibold">{snap.effectiveDate}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t("dialogs.indexConstituents.namesTotal", {
                              count: snap.constituents.length,
                              pct: snap.totalWeightPct.toFixed(2),
                            })}
                          </p>
                        </div>
                      </Button>
                      {openSnap && (
                        <div className="flex min-h-0 flex-1 flex-col border-t border-[#e4ebf8] px-3 py-2 dark:border-white/10">
                          <div className="min-h-0 flex-1 space-y-1 overflow-auto">
                            {snap.constituents.map((c) => (
                              <div key={c.stockId} className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-mono font-semibold">{c.ticker}</span>
                                <span className="font-data text-muted-foreground">{c.weightPct.toFixed(2)}%</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" onClick={() => applySnapshot(snap.effectiveDate, "edit")}>
                              <PenLine className="me-1 h-3.5 w-3.5" /> {t("common.edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-500 hover:text-rose-600"
                              onClick={() => setDeleteTarget(snap.effectiveDate)}
                            >
                              <Trash2 className="me-1 h-3.5 w-3.5" /> {t("common.delete")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={t("dialogs.indexConstituents.itemName", { date: deleteTarget || "" })}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget); }}
        isPending={deleteMut.isPending}
      />
    </>
  );
}
