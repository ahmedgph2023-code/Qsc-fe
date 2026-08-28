import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  previewIndexDataUpload,
  commitIndexDataUpload,
  createIndexDataPoint,
  updateIndexDataPoint,
  downloadIndexTemplate,
  type IndexDataPoint,
  type IndexDataPointInput,
  type IndexUploadPreview,
} from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/phase1/DatePicker";
import { UploadConflictPreviewDialog, type ConflictDecision } from "@/components/UploadConflictPreviewDialog";
import { Loader2, Upload, Download } from "lucide-react";

function fmtLevel(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ohlcLabel(r: { value: number; openValue?: number | null; highValue?: number | null; lowValue?: number | null }) {
  return `O ${fmtLevel(r.openValue)} · H ${fmtLevel(r.highValue)} · L ${fmtLevel(r.lowValue)} · C ${fmtLevel(r.value)}`;
}

export function IndexDataPointDialog({
  open,
  onOpenChange,
  indexId,
  editPoint,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  indexId: string;
  editPoint: IndexDataPoint | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!editPoint;
  const [date, setDate] = useState("");
  const [openValue, setOpenValue] = useState("");
  const [highValue, setHighValue] = useState("");
  const [lowValue, setLowValue] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(editPoint?.date?.slice(0, 10) || "");
    setOpenValue(editPoint?.openValue != null ? String(editPoint.openValue) : "");
    setHighValue(editPoint?.highValue != null ? String(editPoint.highValue) : "");
    setLowValue(editPoint?.lowValue != null ? String(editPoint.lowValue) : "");
    setValue(editPoint != null ? String(editPoint.value) : "");
    setError("");
  }, [open, editPoint]);

  const numOrNull = (v: string) => {
    if (!v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const save = async () => {
    const close = Number(value);
    if (!date || !Number.isFinite(close) || close <= 0) {
      setError(t("dialogs.indexDataPoint.dateCloseRequired"));
      return;
    }
    const payload: IndexDataPointInput = {
      date,
      value: close,
      openValue: numOrNull(openValue),
      highValue: numOrNull(highValue),
      lowValue: numOrNull(lowValue),
    };
    setSaving(true);
    setError("");
    try {
      if (isEdit) await updateIndexDataPoint(indexId, editPoint!.date.slice(0, 10), payload);
      else await createIndexDataPoint(indexId, payload);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || t("dialogs.indexDataPoint.saveFailed"));
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
              ? t("dialogs.indexDataPoint.editTitle", { date: editPoint?.date.slice(0, 10) })
              : t("dialogs.indexDataPoint.addTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialogs.indexDataPoint.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs uppercase font-mono">{t("common.date")}</Label>
            <DatePicker value={date} onChange={setDate} disabled={isEdit} className="font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.openPrice")}</Label>
              <Input value={openValue} onChange={(e) => setOpenValue(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.high")}</Label>
              <Input value={highValue} onChange={(e) => setHighValue(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("common.low")}</Label>
              <Input value={lowValue} onChange={(e) => setLowValue(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-mono">{t("dialogs.indexDataPoint.closeRequired")}</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
            </div>
          </div>
          {error && <p className="text-sm text-rose-500 font-mono">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
            {isEdit ? t("common.update") : t("dialogs.indexDataPoint.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IndexExcelUploadControls({
  indexId,
  onDone,
  showTemplate = true,
}: {
  indexId: string;
  onDone: () => void;
  showTemplate?: boolean;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<IndexUploadPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState("");

  const onFile = async (file: File | null) => {
    if (!file || !indexId) return;
    setBusy(true);
    setError("");
    try {
      const data = await previewIndexDataUpload(indexId, file);
      setPreview(data);
      setPreviewOpen(true);
    } catch (e: any) {
      setError(e.message || t("dialogs.indexDataPoint.previewFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toRow = (r: IndexDataPointInput): IndexDataPointInput => ({
    date: r.date,
    value: r.value,
    openValue: r.openValue ?? null,
    highValue: r.highValue ?? null,
    lowValue: r.lowValue ?? null,
  });

  const confirm = async (decisions: Record<string, ConflictDecision>) => {
    if (!preview) return;
    setCommitting(true);
    try {
      const overwriteRows = preview.conflicts
        .filter((c) => decisions[c.date] === "overwrite")
        .map((c) => toRow(c.incoming));
      await commitIndexDataUpload(indexId, {
        newRows: preview.newRows.map(toRow),
        overwriteRows,
      });
      setPreviewOpen(false);
      setPreview(null);
      onDone();
    } catch (e: any) {
      setError(e.message || t("dialogs.indexDataPoint.commitFailed"));
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      <div className="flex flex-wrap gap-2">
        {showTemplate && (
          <Button type="button" variant="outline" size="sm" onClick={() => downloadIndexTemplate()}>
            <Download className="w-4 h-4 me-2" /> {t("dialogs.indexDataPoint.template")}
          </Button>
        )}
        <Button type="button" size="sm" disabled={!indexId || busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Upload className="w-4 h-4 me-2" />}
          {t("dialogs.indexDataPoint.uploadPreview")}
        </Button>
      </div>
      {error && <p className="text-xs text-rose-500 font-mono">{error}</p>}
      <UploadConflictPreviewDialog
        open={previewOpen}
        onOpenChange={(v) => { setPreviewOpen(v); if (!v) setPreview(null); }}
        title={preview?.name
          ? t("dialogs.uploadConflict.uploadPreviewNamed", { name: preview.name })
          : t("dialogs.uploadConflict.uploadPreview")}
        newCount={preview?.newCount || 0}
        conflicts={(preview?.conflicts || []).map((c) => ({
          date: c.date,
          currentLabel: ohlcLabel(c.current),
          incomingLabel: ohlcLabel(c.incoming),
        }))}
        committing={committing}
        onConfirm={confirm}
      />
    </div>
  );
}
