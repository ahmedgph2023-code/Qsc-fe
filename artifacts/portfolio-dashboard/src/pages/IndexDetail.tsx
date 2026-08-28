import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import {
  getIndex,
  getIndexDataPoints,
  getIndexConstituentsHistory,
  deleteIndexConstituentsSnapshot,
  deleteIndexDataPoint,
  exportIndexDataPoints,
  type IndexDataPoint,
  type IndexConstituentRow,
} from "@/lib/api";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { TimeRangeToggle } from "@/components/phase1/TimeRangeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  AppTable,
  CLIENT_PAGE_SIZES,
  ClientTableFooter,
  DataTableEmpty,
  DataTableHead,
  DataTableToolbar,
  useClientTablePage,
} from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { IndexConstituentsDialog } from "@/components/IndexConstituentsDialog";
import { IndexDataPointDialog, IndexExcelUploadControls } from "@/components/IndexDataPointDialog";
import {
  ChevronLeft, Upload, Loader2, TrendingUp, TrendingDown,
  Layers, PenLine, Trash2, ChevronDown, ChevronRight, Plus, Download,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function formatNum(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ConstituentSnapTable({
  rows,
}: {
  rows: IndexConstituentRow[];
}) {
  const { t } = useTranslation();
  const paging = useClientTablePage(rows, String(rows.length));
  return (
    <AppTable footer={<ClientTableFooter paging={paging} />}>
      <TableHeader>
        <TableRow className="clients-thead-row h-10">
          <DataTableHead className="ps-5">{t("common.ticker")}</DataTableHead>
          <DataTableHead>{t("common.company")}</DataTableHead>
          <DataTableHead>{t("common.sector")}</DataTableHead>
          <DataTableHead align="end" className="pe-5">{t("indexDetail.weightPct")}</DataTableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paging.paged.map((c) => (
          <TableRow key={c.stockId} className="clients-row">
            <TableCell className="ps-5 font-mono font-semibold">{c.ticker ?? "—"}</TableCell>
            <TableCell className="text-sm">{c.companyName ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{c.sector ?? "—"}</TableCell>
            <TableCell className="pe-5 text-end font-data">{c.weightPct.toFixed(2)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AppTable>
  );
}

function UploadDataDialog({ indexId, indexName, onDone }: { indexId: string; indexName: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="w-4 h-4 me-2" /> {t("common.uploadData")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("indexDetail.uploadDataTitle")}</DialogTitle>
          <DialogDescription>
            {t("indexDetail.uploadDataDesc", { name: indexName })}
          </DialogDescription>
        </DialogHeader>
        <IndexExcelUploadControls
          indexId={indexId}
          onDone={() => { onDone(); setOpen(false); }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function IndexDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState("1Y");
  const [dateExact, setDateExact] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZES[0]);
  const [exporting, setExporting] = useState<"filtered" | "all" | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [pointDialogOpen, setPointDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<IndexDataPoint | null>(null);
  const [deletePointDate, setDeletePointDate] = useState<string | null>(null);

  const { data: index, isLoading, error } = useQuery({
    queryKey: ["index", id], queryFn: () => getIndex(id!), enabled: !!id,
  });

  const { data: pointsPage, isFetching: pointsFetching } = useQuery({
    queryKey: ["index-data-points", id, dateExact, dateFrom, dateTo, page, pageSize],
    queryFn: () =>
      getIndexDataPoints(id!, {
        date: dateExact || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page,
        pageSize,
      }),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["index-constituents", id],
    queryFn: () => getIndexConstituentsHistory(id!),
    enabled: !!id,
  });

  const refreshIndex = () => {
    queryClient.invalidateQueries({ queryKey: ["index", id] });
    queryClient.invalidateQueries({ queryKey: ["index-data-points", id] });
    queryClient.invalidateQueries({ queryKey: ["indices"] });
  };

  const deleteMut = useMutation({
    mutationFn: (date: string) => deleteIndexConstituentsSnapshot(id!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["index-constituents", id] });
      queryClient.invalidateQueries({ queryKey: ["index-reference"] });
      setDeleteTarget(null);
    },
  });

  const deletePointMut = useMutation({
    mutationFn: (date: string) => deleteIndexDataPoint(id!, date),
    onSuccess: () => {
      refreshIndex();
      setDeletePointDate(null);
    },
    onError: () => setDeletePointDate(null),
  });

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
        await exportIndexDataPoints(id, { all: true });
      } else {
        await exportIndexDataPoints(id, {
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
    return <Shell><div className="flex items-center justify-center py-20"><p className="text-muted-foreground font-mono">{t("indexDetail.loading")}</p></div></Shell>;
  }
  if (error || !index) {
    return <Shell><div className="flex flex-col items-center justify-center py-20 text-center"><h2 className="text-2xl font-bold mb-2">{t("indexDetail.notFound")}</h2><Button asChild className="mt-4"><Link href="/indices">{t("indexDetail.back")}</Link></Button></div></Shell>;
  }

  const dataPoints = (index.dataPoints || []) as IndexDataPoint[];
  const sorted = [...dataPoints].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.length > 0 ? Number(sorted[sorted.length - 1].value) : 0;
  const prev = sorted.length > 1 ? Number(sorted[sorted.length - 2].value) : latest;
  const dayChangePct = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
  const isUp = dayChangePct >= 0;
  const snapshots = history?.snapshots || [];
  const totalPoints = pointsPage?.pagination.total ?? dataPoints.length;

  const filterDays = timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : timeRange === "6M" ? 180 : timeRange === "1Y" ? 365 : timeRange === "3Y" ? 1095 : sorted.length;
  const chartData = sorted.slice(-filterDays).map((d) => ({ date: d.date, value: Number(d.value) }));

  return (
    <Shell>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-3 text-muted-foreground hover:text-foreground">
          <Link href="/indices"><ChevronLeft className="w-4 h-4 me-1 rtl:rotate-180" /> {t("indexDetail.back")}</Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{index.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono">{t("indexDetail.pointsBadge", { count: totalPoints })}</Badge>
                  <Badge variant="outline" className="font-mono">{t("indexDetail.constituentSets", { count: snapshots.length })}</Badge>
                  <span className={`font-mono text-sm flex items-center gap-1 ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? "+" : ""}{dayChangePct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{index.description || t("common.noDescription")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-end me-2">
              <p className="text-xs text-muted-foreground uppercase font-mono mb-1">{t("indexDetail.currentValue")}</p>
              <p className="text-4xl font-bold font-data">{latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <UploadDataDialog indexId={id!} indexName={index.name} onDone={refreshIndex} />
            <IndexConstituentsDialog
              fixedIndexId={id!}
              fixedIndexName={index.name}
              initialEffectiveDate={editDate}
              open={managerOpen}
              onOpenChange={(v) => {
                setManagerOpen(v);
                if (!v) setEditDate(null);
              }}
              triggerLabel={t("indexDetail.manageConstituents")}
            />
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" /> {t("indexDetail.constituents")}
            </CardTitle>
            <CardDescription>
              {t("indexDetail.constituentsSub")}
            </CardDescription>
          </div>
          <Button onClick={() => { setEditDate(null); setManagerOpen(true); }}>
            <PenLine className="w-4 h-4 me-2" /> {t("indexDetail.addEdit")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> {t("indexDetail.loadingConstituents")}
            </div>
          )}
          {!historyLoading && snapshots.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{t("indexDetail.noConstituents")}</p>
              <p className="text-xs mb-4">{t("indexDetail.noConstituentsDesc")}</p>
              <Button variant="outline" onClick={() => { setEditDate(null); setManagerOpen(true); }}>{t("indexDetail.addConstituents")}</Button>
            </div>
          )}
          {snapshots.map((snap) => {
            const openSnap = expandedDate === snap.effectiveDate || (!expandedDate && snap.effectiveDate === snapshots[0]?.effectiveDate);
            return (
              <div key={snap.effectiveDate} className="rounded-lg border border-border/70 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/20">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto flex-1 justify-start gap-2 px-0 text-start hover:bg-transparent"
                    onClick={() => setExpandedDate(openSnap && expandedDate === snap.effectiveDate ? null : snap.effectiveDate)}
                  >
                    {openSnap ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180" />}
                    <div>
                      <p className="font-mono font-semibold">{snap.effectiveDate}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("indexDetail.namesTotalWeight", { count: snap.constituents.length, weight: snap.totalWeightPct.toFixed(2) })}
                      </p>
                    </div>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditDate(snap.effectiveDate); setManagerOpen(true); }}>
                    <PenLine className="w-3.5 h-3.5 me-1" /> {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-rose-500 hover:text-rose-600"
                    onClick={() => setDeleteTarget(snap.effectiveDate)}
                  >
                    <Trash2 className="w-3.5 h-3.5 me-1" /> {t("common.delete")}
                  </Button>
                </div>
                {openSnap && <ConstituentSnapTable rows={snap.constituents} />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>{t("indexDetail.valueHistory")}</CardTitle>
              <CardDescription>{t("indexDetail.valueHistorySub")}</CardDescription>
            </div>
            <TimeRangeToggle value={timeRange} onChange={setTimeRange} ranges={["1M", "3M", "6M", "1Y", "3Y", "ALL"]} />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} fontFamily="var(--font-mono)"
                    tickFormatter={(v) => { const d = new Date(v); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }}
                    interval="preserveStartEnd" />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["auto", "auto"]}
                    tickFormatter={(v) => (v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ fontFamily: "var(--font-mono)" }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                    formatter={(value: number) => [Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), t("indices.value")]} />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false}
                    activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <AppTable
        loading={pointsFetching}
        toolbar={
          <DataTableToolbar
            icon="/analytics.png"
            count={
              <div className="min-w-0">
                <span className="block truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">
                  {t("indexDetail.dataPoints", { count: totalPoints })}
                </span>
                <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--shell-muted)]">
                  {t("indexDetail.dataPointsSub")}
                </span>
              </div>
            }
            countLoading={pointsFetching && !pointsPage}
            filterLabel={t("customers.filters")}
            filterCount={[dateExact, dateFrom, dateTo].filter(Boolean).length}
            filterPanel={
              <>
                <div className="grid gap-1">
                  <span className="px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--shell-muted)]">
                    {t("indexDetail.exactDate")}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("filtered")}
                  disabled={!!exporting || !pointsPage?.pagination.total || (!dateExact && !dateFrom && !dateTo)}
                >
                  {exporting === "filtered" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Download className="w-4 h-4 me-2" />}
                  {t("common.exportExcel")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("all")} disabled={!!exporting}>
                  {exporting === "all" ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Download className="w-4 h-4 me-2" />}
                  {t("common.exportAll")}
                </Button>
              </>
            }
          />
        }
        footer={
          <TablePageFooter
            total={pointsPage?.pagination.total ?? 0}
            page={pointsPage?.pagination.page ?? page}
            pageSize={pageSize}
            pageSizes={CLIENT_PAGE_SIZES}
            loading={pointsFetching}
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
                <DataTableHead className="ps-5">{t("common.date")}</DataTableHead>
                <DataTableHead align="end">{t("common.openPrice")}</DataTableHead>
                <DataTableHead align="end">{t("common.high")}</DataTableHead>
                <DataTableHead align="end">{t("common.low")}</DataTableHead>
                <DataTableHead align="end">{t("common.closePrice")}</DataTableHead>
                <DataTableHead align="end" className="pe-5">{t("common.actions")}</DataTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pointsPage?.data.length ? (
                <DataTableEmpty colSpan={6} title={t("indexDetail.noDataPointsMatch")} description={t("indexDetail.noDataPointsMatchDesc")} />
              ) : (
                pointsPage.data.map((d) => (
                  <TableRow key={d.id} className="clients-row">
                    <TableCell className="ps-5 font-mono text-sm">{d.date}</TableCell>
                    <TableCell className="text-end font-data text-sm">{formatNum(d.openValue)}</TableCell>
                    <TableCell className="text-end font-data text-sm">{formatNum(d.highValue)}</TableCell>
                    <TableCell className="text-end font-data text-sm">{formatNum(d.lowValue)}</TableCell>
                    <TableCell className="text-end font-data font-bold text-lg">{formatNum(d.value)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => { setEditingPoint(d); setPointDialogOpen(true); }}
                        >
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-rose-500 hover:text-rose-600"
                          onClick={() => setDeletePointDate(d.date.slice(0, 10))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </AppTable>

      <IndexDataPointDialog
        open={pointDialogOpen}
        onOpenChange={(v) => { setPointDialogOpen(v); if (!v) setEditingPoint(null); }}
        indexId={id!}
        editPoint={editingPoint}
        onSaved={refreshIndex}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={t("indexDetail.itemConstituents", { date: deleteTarget || "" })}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget); }}
        isPending={deleteMut.isPending}
      />

      <ConfirmDeleteDialog
        open={!!deletePointDate}
        onOpenChange={(v) => { if (!v) setDeletePointDate(null); }}
        itemName={deletePointDate ? t("indexDetail.itemIndexValue", { date: deletePointDate }) : ""}
        onConfirm={() => { if (deletePointDate) deletePointMut.mutate(deletePointDate); }}
        isPending={deletePointMut.isPending}
      />
    </Shell>
  );
}
