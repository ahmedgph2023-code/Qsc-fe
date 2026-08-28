import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, CLIENT_PAGE_SIZES } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { Badge } from "@/components/ui/badge";
import {
  deleteOfficialClose,
  getOfficialClosesSummary,
  importKbOfficialCloses,
  listOfficialCloses,
  uploadOfficialClosesFile,
  upsertOfficialClose,
  getKbIndexLevelsSummary,
  importKbIndexLevels,
} from "@/lib/api";

export function OfficialClosesPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ticker, setTicker] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [addTicker, setAddTicker] = useState("MHAR");
  const [addDate, setAddDate] = useState("2024-12-01");
  const [addPrice, setAddPrice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZES[1] ?? 25);
  const offset = (page - 1) * pageSize;

  const summary = useQuery({ queryKey: ["official-closes-summary"], queryFn: getOfficialClosesSummary });
  const list = useQuery({
    queryKey: ["official-closes", ticker, from, to, page, pageSize],
    queryFn: () => listOfficialCloses({ ticker, from, to, limit: pageSize, offset }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["official-closes"] });
    qc.invalidateQueries({ queryKey: ["official-closes-summary"] });
    qc.invalidateQueries({ queryKey: ["kb-index-levels"] });
    qc.invalidateQueries({ queryKey: ["stocks"] });
  };

  const indices = useQuery({ queryKey: ["kb-index-levels"], queryFn: getKbIndexLevelsSummary });

  const save = useMutation({
    mutationFn: () => upsertOfficialClose({ ticker: addTicker, date: addDate, price: Number(addPrice) }),
    onSuccess: () => {
      setAddPrice("");
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: ({ ticker: tk, date }: { ticker: string; date: string }) => deleteOfficialClose(tk, date),
    onSuccess: invalidate,
  });
  const importKb = useMutation({
    mutationFn: importKbOfficialCloses,
    onSuccess: invalidate,
  });
  const upload = useMutation({
    mutationFn: uploadOfficialClosesFile,
    onSuccess: invalidate,
  });
  const importIndices = useMutation({
    mutationFn: importKbIndexLevels,
    onSuccess: invalidate,
  });

  const sampleClose = summary.data?.sample.close;
  const sampleOk = sampleClose != null && sampleClose > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("systemConfig.pricesIntro")}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t("systemConfig.pricesRows")}</div>
          <div className="mt-1 font-data text-lg">{summary.data?.rowCount ?? "—"}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t("systemConfig.pricesRange")}</div>
          <div className="mt-1 font-data text-sm">
            {summary.data?.minDate || "—"} → {summary.data?.maxDate || "—"}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">{t("systemConfig.pricesSample")}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-data text-sm">MHAR 2024-12-01</span>
            <Badge variant={sampleOk ? "default" : "outline"}>
              {sampleOk ? String(sampleClose) : t("systemConfig.pricesMissing")}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{summary.data?.kbFile}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => importKb.mutate()}
          disabled={importKb.isPending || summary.data?.kbFileExists === false}
        >
          {importKb.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
          {t("systemConfig.pricesImportKb")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.md"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
          {upload.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
          {t("systemConfig.pricesUpload")}
        </Button>
        {importKb.data && (
          <span className="text-xs text-muted-foreground">
            {t("systemConfig.pricesImportResult", { count: String(importKb.data.upserted) })}
          </span>
        )}
      </div>
      {(importKb.error || upload.error || save.error) && (
        <p className="text-sm text-loss">
          {(importKb.error as Error)?.message
            || (upload.error as Error)?.message
            || (save.error as Error)?.message}
        </p>
      )}

      <div className="rounded-2xl border bg-card p-4 space-y-3">
        <div className="text-sm font-medium">{t("systemConfig.pricesAdd")}</div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={addTicker}
            onChange={(e) => setAddTicker(e.target.value.toUpperCase())}
            placeholder={t("common.ticker")}
            className="w-28 font-data"
          />
          <DatePicker value={addDate} onChange={setAddDate} className="w-40" />
          <Input
            value={addPrice}
            onChange={(e) => setAddPrice(e.target.value)}
            placeholder={t("systemConfig.pricesClose")}
            className="w-28 font-data"
          />
          <Button
            size="sm"
            disabled={save.isPending || !addTicker || !addDate || !addPrice}
            onClick={() => save.mutate()}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={ticker}
          onChange={(e) => { setTicker(e.target.value.toUpperCase()); setPage(1); }}
          placeholder={t("systemConfig.searchTicker")}
          className="max-w-xs"
        />
        <DatePicker value={from} onChange={(v) => { setFrom(v); setPage(1); }} className="w-40" />
        <DatePicker value={to} onChange={(v) => { setTo(v); setPage(1); }} className="w-40" />
      </div>

      <AppTable
        footer={
          <TablePageFooter
            total={list.data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            pageSizes={CLIENT_PAGE_SIZES}
            loading={list.isLoading}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        }
      >
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("systemConfig.pricesClose")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">{t("common.loading")}</TableCell>
              </TableRow>
            ) : (list.data?.data.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState
                    title={t("systemConfig.pricesEmptyTitle")}
                    description={t("systemConfig.pricesEmptyDesc")}
                  />
                </TableCell>
              </TableRow>
            ) : (list.data?.data ?? []).map((row) => (
              <TableRow key={`${row.ticker}-${row.date}`}>
                <TableCell>
                  <div className="font-medium">{row.ticker}</div>
                  <div className="text-xs text-muted-foreground">{row.companyName}</div>
                </TableCell>
                <TableCell className="font-data text-sm">{row.date}</TableCell>
                <TableCell className="font-data">{row.closePrice}</TableCell>
                <TableCell className="text-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ ticker: row.ticker, date: row.date })}
                  >
                    {t("common.delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>

      <div className="border-t pt-4 space-y-3">
        <p className="text-sm text-muted-foreground">{t("systemConfig.indicesIntro")}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{t("systemConfig.indicesRows")}</div>
            <div className="mt-1 font-data text-lg">{indices.data?.rowCount ?? "—"}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              QERI {indices.data?.qeriCount ?? "—"} · DSM {indices.data?.dsmCount ?? "—"}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{t("systemConfig.pricesRange")}</div>
            <div className="mt-1 font-data text-sm">
              {indices.data?.minDate || "—"} → {indices.data?.maxDate || "—"}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs text-muted-foreground">{t("systemConfig.pricesSample")}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={indices.data?.sampleDsm.value === indices.data?.sampleDsm.expected ? "default" : "outline"}>
                DSM {indices.data?.sampleDsm.date} {indices.data?.sampleDsm.value ?? t("systemConfig.pricesMissing")}
              </Badge>
              <Badge variant={indices.data?.sampleQeri.value === indices.data?.sampleQeri.expected ? "default" : "outline"}>
                QERI {indices.data?.sampleQeri.date} {indices.data?.sampleQeri.value ?? t("systemConfig.pricesMissing")}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{indices.data?.kbFile}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => importIndices.mutate()}
            disabled={importIndices.isPending || indices.data?.kbFileExists === false}
          >
            {importIndices.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t("systemConfig.indicesImportKb")}
          </Button>
          {importIndices.data && (
            <span className="text-xs text-muted-foreground">
              {t("systemConfig.indicesImportResult", { count: String(importIndices.data.upserted) })}
            </span>
          )}
        </div>
        {importIndices.error && (
          <p className="text-sm text-loss">{(importIndices.error as Error)?.message}</p>
        )}
      </div>
    </div>
  );
}
