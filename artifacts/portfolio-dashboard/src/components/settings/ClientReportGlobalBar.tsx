import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/phase1/SelectField";
import {
  getClientReportSections,
  listClientReportBoard,
  updateGlobalClientReportConfig,
  type ClientReportGlobalConfig,
} from "@/lib/api";

const WEEKDAYS = [
  { value: 0, key: "sun" },
  { value: 1, key: "mon" },
  { value: 2, key: "tue" },
  { value: 3, key: "wed" },
  { value: 4, key: "thu" },
  { value: 5, key: "fri" },
  { value: 6, key: "sat" },
] as const;

function formatSendTime(sendTime: string) {
  const [h, m] = sendTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** Compact schedule chips + Configure — sits beside Settings title/description. */
export function ClientReportGlobalBar() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientReportGlobalConfig | null>(null);
  const [formError, setFormError] = useState("");

  const { data } = useQuery({
    queryKey: ["client-report-board"],
    queryFn: listClientReportBoard,
  });
  const { data: sectionsData } = useQuery({
    queryKey: ["client-report-sections"],
    queryFn: getClientReportSections,
  });

  const global = data?.global;
  const sectionOptions = sectionsData?.sections ?? [];

  const saveMut = useMutation({
    mutationFn: () => updateGlobalClientReportConfig(form!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-report-board"] });
      setOpen(false);
      setFormError("");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const openEdit = () => {
    if (!global) return;
    setForm({ ...global });
    setFormError("");
    setOpen(true);
  };

  const frequencyLabel = useMemo(() => {
    if (!global) return null;
    return global.frequencyType === "daily"
      ? t("clientReports.frequency.daily")
      : t("clientReports.frequency.custom");
  }, [global, t]);

  if (!global) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Badge variant="outline">{frequencyLabel}</Badge>
        <Badge variant="outline">{formatSendTime(global.sendTime)}</Badge>
        <Badge variant={global.schedulingEnabled ? "default" : "secondary"}>
          {global.schedulingEnabled ? t("clientReports.schedulingOn") : t("clientReports.schedulingOff")}
        </Badge>
        <Button type="button" size="sm" variant="outline" onClick={openEdit}>
          {t("clientReports.editGlobal")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("clientReports.globalTitle")}</DialogTitle>
            <DialogDescription>{t("clientReports.globalDesc")}</DialogDescription>
          </DialogHeader>
          {form ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between gap-3">
                <Label>{t("clientReports.field.schedulingEnabled")}</Label>
                <Switch
                  checked={form.schedulingEnabled}
                  onCheckedChange={(schedulingEnabled) => setForm((p) => p && { ...p, schedulingEnabled })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("clientReports.field.sections")}</Label>
                <div className="flex flex-wrap gap-2">
                  {sectionOptions.map((section) => (
                    <Button
                      key={section}
                      type="button"
                      size="sm"
                      variant={form.dataSections.includes(section) ? "default" : "outline"}
                      onClick={() => setForm((p) => {
                        if (!p) return p;
                        const dataSections = p.dataSections.includes(section)
                          ? p.dataSections.filter((s) => s !== section)
                          : [...p.dataSections, section];
                        return { ...p, dataSections };
                      })}
                    >
                      {t(`clientReports.sections.${section}`)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("clientReports.field.frequency")}</Label>
                <SelectField
                  value={form.frequencyType}
                  onValueChange={(v) => setForm((p) => p && { ...p, frequencyType: v as "daily" | "custom" })}
                  options={[
                    { value: "daily", label: t("clientReports.frequency.daily") },
                    { value: "custom", label: t("clientReports.frequency.custom") },
                  ]}
                />
              </div>
              {form.frequencyType === "custom" ? (
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((d) => (
                    <Button
                      key={d.value}
                      type="button"
                      size="sm"
                      variant={form.customDays.includes(d.value) ? "default" : "outline"}
                      onClick={() => setForm((p) => {
                        if (!p) return p;
                        const customDays = p.customDays.includes(d.value)
                          ? p.customDays.filter((x) => x !== d.value)
                          : [...p.customDays, d.value].sort((a, b) => a - b);
                        return { ...p, customDays };
                      })}
                    >
                      {t(`clientReports.weekdays.${d.key}`)}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="gr-time-bar">{t("clientReports.field.sendTime")}</Label>
                  <Input
                    id="gr-time-bar"
                    type="time"
                    value={form.sendTime}
                    onChange={(e) => setForm((p) => p && { ...p, sendTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("clientReports.field.asOfMode")}</Label>
                  <SelectField
                    value={form.asOfMode}
                    onValueChange={(v) => setForm((p) => p && { ...p, asOfMode: v as ClientReportGlobalConfig["asOfMode"] })}
                    options={[
                      { value: "latest", label: t("clientReports.asOf.latest") },
                      { value: "previous_trading_day", label: t("clientReports.asOf.previous") },
                    ]}
                  />
                </div>
              </div>
              {formError ? <p className="text-sm text-loss">{formError}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="button" disabled={saveMut.isPending || !form} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
