import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, PenLine, Calculator } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { SelectField } from "@/components/phase1/SelectField";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { EmptyState } from "@/components/phase1/PageHeader";
import {
  createFeeBand, deleteFeeBand, generateFeeCharges, getFeeBands, getMandate, updateFeeBand, type FeeBand,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

const emptyForm = {
  effectiveFrom: "",
  effectiveTo: "",
  rebateCommissionPct: "",
  annualManagementFeePct: "",
  performanceFeePct: "",
  performanceFrequency: "annual" as "annual" | "quarterly",
  highWaterMark: "",
  notes: "",
};

export function FeeBandsCard({ customerId, portfolioId }: { customerId: string; portfolioId: string }) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canEdit = canPerformAction("fee.generate", { role, username })
    || canPerformAction("mandate.draft", { role, username });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeBand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: mandate } = useQuery({
    queryKey: ["mandate", customerId],
    queryFn: () => getMandate(customerId),
    retry: false,
  });
  const { data: bands = [] } = useQuery({
    queryKey: ["fee-bands", customerId],
    queryFn: () => getFeeBands(customerId),
  });
  const paging = useClientTablePage(bands, String(bands.length));

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        rebateCommissionPct: Number(form.rebateCommissionPct),
        annualManagementFeePct: Number(form.annualManagementFeePct),
        performanceFeePct: Number(form.performanceFeePct),
        performanceFrequency: form.performanceFrequency,
        highWaterMark: form.highWaterMark ? Number(form.highWaterMark) : undefined,
        notes: form.notes || null,
      };
      return editing ? updateFeeBand(editing.id, payload) : createFeeBand(customerId, payload);
    },
    onSuccess: () => {
      setOpen(false);
      setError("");
      qc.invalidateQueries({ queryKey: ["fee-bands", customerId] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFeeBand(id),
    onSuccess: () => {
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["fee-bands", customerId] });
    },
  });

  const genMut = useMutation({
    mutationFn: () => generateFeeCharges({ portfolioId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-charges"] });
      qc.invalidateQueries({ queryKey: ["fee-summary"] });
      qc.invalidateQueries({ queryKey: ["fee-pending"] });
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  function startCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      effectiveFrom: mandate?.contractStart || "",
      highWaterMark: mandate?.initialValue ? String(mandate.initialValue) : "",
    });
    setError("");
    setOpen(true);
  }

  function startEdit(b: FeeBand) {
    setEditing(b);
    setForm({
      effectiveFrom: String(b.effectiveFrom).slice(0, 10),
      effectiveTo: b.effectiveTo ? String(b.effectiveTo).slice(0, 10) : "",
      rebateCommissionPct: String(b.rebateCommissionPct),
      annualManagementFeePct: String(b.annualManagementFeePct),
      performanceFeePct: String(b.performanceFeePct),
      performanceFrequency: b.performanceFrequency,
      highWaterMark: String(b.highWaterMark),
      notes: b.notes || "",
    });
    setError("");
    setOpen(true);
  }

  if (!mandate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("feeBands.title")}</CardTitle>
          <CardDescription>{t("feeBands.mandateRequiredDesc")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      {error && !open && <p className="mb-3 text-sm font-mono text-rose-500">{error}</p>}
      <AppTable
        footer={<ClientTableFooter paging={paging} />}
        toolbar={
          <div className="clients-table-toolbar">
            <div>
              <p className="text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">{t("feeBands.title")}</p>
              <p className="mt-0.5 text-[12px] text-[var(--shell-muted)]">{t("feeBands.description")}</p>
            </div>
            {canEdit ? (
              <div className="ms-auto flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" disabled={genMut.isPending} onClick={() => genMut.mutate()}>
                  {genMut.isPending ? <Loader2 className="me-1 h-3 w-3 animate-spin" /> : <Calculator className="me-1 h-3 w-3" />}
                  {t("feeBands.calculateFees")}
                </Button>
                <Button size="sm" onClick={startCreate}><Plus className="me-1 h-3 w-3" /> {t("feeBands.addBand")}</Button>
              </div>
            ) : null}
          </div>
        }
      >
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs uppercase">{t("feeBands.from")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase">{t("feeBands.to")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("feeBands.rebatePct")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("feeBands.mgmtPctYr")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("feeBands.perfPct")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase">{t("feeBands.frequency")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("feeBands.hwm")}</TableHead>
                  {canEdit && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-4 hover:bg-transparent">
                      <EmptyState
                        title={t("feeBands.emptyTitle")}
                        description={t("feeBands.emptyDesc")}
                      />
                    </TableCell>
                  </TableRow>
                ) : paging.paged.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{String(b.effectiveFrom).slice(0, 10)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {b.effectiveTo ? String(b.effectiveTo).slice(0, 10) : t("feeBands.openEnded")}
                    </TableCell>
                    <TableCell className="text-end font-data">{Number(b.rebateCommissionPct).toFixed(3)}</TableCell>
                    <TableCell className="text-end font-data">{Number(b.annualManagementFeePct).toFixed(2)}</TableCell>
                    <TableCell className="text-end font-data">{Number(b.performanceFeePct).toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {b.performanceFrequency === "quarterly" ? t("feeBands.quarterlyShort") : t("feeBands.annual")}
                    </TableCell>
                    <TableCell className="text-end font-data">{formatCurrency(Number(b.highWaterMark))}</TableCell>
                    {canEdit && (
                      <TableCell className="text-end">
                        <div className="inline-flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(b)}><PenLine className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="cdp-delete" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
      </AppTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? t("feeBands.editTitle") : t("feeBands.addTitle")}</DialogTitle>
            <DialogDescription>{t("feeBands.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.effectiveRange")}</Label>
              <DateRangePicker
                from={form.effectiveFrom}
                to={form.effectiveTo}
                onChange={({ from, to }) => setForm({ ...form, effectiveFrom: from, effectiveTo: to })}
                placeholder={t("feeBands.rangePlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.rebateCommission")}</Label>
              <Input type="number" step="0.001" placeholder={t("feeBands.rebatePlaceholder")} value={form.rebateCommissionPct} onChange={(e) => setForm({ ...form, rebateCommissionPct: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.annualManagement")}</Label>
              <Input type="number" step="0.01" placeholder={t("feeBands.mgmtPlaceholder")} value={form.annualManagementFeePct} onChange={(e) => setForm({ ...form, annualManagementFeePct: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.performancePct")}</Label>
              <Input type="number" step="0.01" placeholder={t("feeBands.perfPlaceholder")} value={form.performanceFeePct} onChange={(e) => setForm({ ...form, performanceFeePct: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.performanceFrequency")}</Label>
              <SelectField
                className="w-full"
                value={form.performanceFrequency}
                onValueChange={(v) => setForm({ ...form, performanceFrequency: v as "annual" | "quarterly" })}
                options={[
                  { value: "annual", label: t("feeBands.annual") },
                  { value: "quarterly", label: t("feeBands.quarterly") },
                ]}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">{t("feeBands.highWaterMark")}</Label>
              <Input type="number" step="0.01" value={form.highWaterMark} onChange={(e) => setForm({ ...form, highWaterMark: e.target.value })} />
              <p className="text-[11px] text-muted-foreground">{t("feeBands.hwmHint")}</p>
            </div>
            <div className="col-span-2">
              <Input placeholder={t("feeBands.notesPlaceholder")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          {error && <p className="text-sm font-mono text-rose-500">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button disabled={!form.effectiveFrom || saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending && <Loader2 className="me-2 h-3 w-3 animate-spin" />}
              {t("feeBands.saveBand")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title={t("feeBands.deleteTitle")}
        description={t("feeBands.deleteDescription")}
        itemName={t("feeBands.deleteItemName")}
        onConfirm={() => { if (deleteId) deleteMut.mutate(deleteId); }}
        isPending={deleteMut.isPending}
      />
    </>
  );
}
