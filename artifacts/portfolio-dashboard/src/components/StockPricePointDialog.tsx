import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  previewStockPriceUpload,
  commitStockPriceUpload,
  createStockPrice,
  updateStockPrice,
  downloadStockTemplate,
  type StockPricePoint,
  type StockPriceInput,
  type StockUploadPreview,
} from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/phase1/DatePicker";
import { UploadConflictPreviewDialog, type ConflictDecision } from "@/components/UploadConflictPreviewDialog";
import { Loader2, Upload, Download } from "lucide-react";

export function StockPricePointDialog({
  open,
  onOpenChange,
  stockId,
  editPoint,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stockId: string;
  editPoint: StockPricePoint | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!editPoint;
  const [date, setDate] = useState("");
  const [openPrice, setOpenPrice] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [lowPrice, setLowPrice] = useState("");
  const [closePrice, setClosePrice] = useState("");
  const [volume, setVolume] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(editPoint?.date?.slice(0, 10) || "");
    setOpenPrice(editPoint?.openPrice?.toString() || "");
    setHighPrice(editPoint?.highPrice?.toString() || "");
    setLowPrice(editPoint?.lowPrice?.toString() || "");
    setClosePrice((editPoint?.closePrice ?? editPoint?.price)?.toString() || "");
    setVolume(editPoint?.volume?.toString() || "");
    setError("");
  }, [open, editPoint]);

  const numOrUndef = (v: string) => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    const close = Number(closePrice);
    if (!date || !Number.isFinite(close) || close <= 0) {
      setError(t("dialogs.stockPricePoint.dateCloseRequired"));
      return;
    }
    const payload: StockPriceInput = {
      date,
      price: close,
      closePrice: close,
      openPrice: numOrUndef(openPrice),
      highPrice: numOrUndef(highPrice),
      lowPrice: numOrUndef(lowPrice),
      volume: numOrUndef(volume),
    };
    setSaving(true);
    setError("");
    try {
      if (isEdit) await updateStockPrice(stockId, editPoint!.date.slice(0, 10), payload);
      else await createStockPrice(stockId, payload);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || t("dialogs.stockPricePoint.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("dialogs.stockPricePoint.editTitle", { date: editPoint?.date.slice(0, 10) })
              : t("dialogs.stockPricePoint.addTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialogs.stockPricePoint.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs uppercase font-mono">{t("common.date")}</Label>
            <DatePicker value={date} onChange={setDate} disabled={isEdit} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.openPrice")}</Label>
              <Input value={openPrice} onChange={(e) => setOpenPrice(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.high")}</Label>
              <Input value={highPrice} onChange={(e) => setHighPrice(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.low")}</Label>
              <Input value={lowPrice} onChange={(e) => setLowPrice(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("dialogs.stockPricePoint.closeRequired")}</Label>
              <Input value={closePrice} onChange={(e) => setClosePrice(e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase font-mono">{t("common.volume")}</Label>
            <Input value={volume} onChange={(e) => setVolume(e.target.value)} className="font-mono" />
          </div>
          {error && <p className="text-sm text-rose-500 font-mono">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
            {isEdit ? t("common.update") : t("dialogs.stockPricePoint.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StockExcelUploadButton({
  stockId,
  onDone,
  variant = "outline",
  size = "sm",
  label,
  className,
}: {
  stockId: string;
  onDone: () => void;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
  label?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<StockUploadPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");
  const resolvedLabel = label ?? t("dialogs.stockPricePoint.uploadExcel");

  const onFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await previewStockPriceUpload(stockId, file);
      setPreview(data);
      setPreviewOpen(true);
    } catch (e: any) {
      setError(e.message || t("dialogs.stockPricePoint.previewFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const confirm = async (decisions: Record<string, ConflictDecision>) => {
    if (!preview) return;
    setCommitting(true);
    try {
      const overwriteRows = preview.conflicts
        .filter((c) => decisions[c.date] === "overwrite")
        .map((c) => ({ date: c.date, price: c.incoming.price }));
      await commitStockPriceUpload(stockId, {
        newRows: preview.newRows.map((r) => ({ date: r.date, price: r.price })),
        overwriteRows,
      });
      setPreviewOpen(false);
      setPreview(null);
      onDone();
    } catch (e: any) {
      setError(e.message || t("dialogs.stockPricePoint.commitFailed"));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      <Button variant={variant} size={size} className={className} disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Upload className="w-4 h-4 me-2" />}
        {resolvedLabel}
      </Button>
      {error && <p className="text-xs text-rose-500 font-mono w-full">{error}</p>}
      <UploadConflictPreviewDialog
        open={previewOpen}
        onOpenChange={(v) => { setPreviewOpen(v); if (!v) setPreview(null); }}
        title={preview?.ticker
          ? t("dialogs.uploadConflict.uploadPreviewNamed", { name: preview.ticker })
          : t("dialogs.uploadConflict.uploadPreview")}
        newCount={preview?.newCount || 0}
        conflicts={(preview?.conflicts || []).map((c) => ({
          date: c.date,
          currentLabel: String(c.current.price),
          incomingLabel: String(c.incoming.price),
        }))}
        committing={committing}
        onConfirm={confirm}
      />
    </>
  );
}

export function StockTemplateDownloadButton() {
  const { t } = useTranslation();
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => downloadStockTemplate()}>
      <Download className="w-4 h-4 me-2" /> {t("dialogs.stockPricePoint.template")}
    </Button>
  );
}
