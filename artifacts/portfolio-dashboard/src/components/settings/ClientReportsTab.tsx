import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, PenLine, Send } from "lucide-react";
import { DataTableToolbar, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { ClientReportPreview } from "@/components/settings/ClientReportPreview";
import { toast } from "@/hooks/use-toast";
import {
  createClientReportConfig,
  getClientReportSections,
  listClientReportBoard,
  previewClientReportByExtId,
  sendClientReportByExtId,
  toggleClientReportByExtId,
  updateClientReportConfig,
  type ClientReportBoardRow,
  type ClientReportPayload,
  type ClientReportSection,
} from "@/lib/api";
import {
  ClientReportContactCell,
  ClientReportDeliveryChannels,
} from "@/components/settings/ClientReportDeliveryChannels";

function formatNextSend(iso: string | null | undefined, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-QA" : "en-GB", {
    timeZone: "Asia/Qatar",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSendTime(sendTime: string) {
  const [h, m] = sendTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function notifyDeliveryResult(
  t: (key: string, opts?: Record<string, unknown>) => string,
  res: {
    status: string;
    delivered?: boolean;
    deliveryNote?: string;
    deliveryResults?: Array<{ channel: string; delivered: boolean; note: string }>;
  },
) {
  const results = res.deliveryResults ?? [];
  const failed = results.filter((r) => !r.delivered);
  const succeeded = results.filter((r) => r.delivered);
  const note = res.deliveryNote?.trim()
    || (failed[0]?.note ?? succeeded[0]?.note)
    || "";

  // Any channel failure → error toast (even if another channel succeeded).
  if (failed.length > 0 || res.status === "failed" || res.delivered === false) {
    toast({
      variant: "destructive",
      title: succeeded.length > 0
        ? t("clientReports.sendPartialTitle")
        : t("clientReports.sendFailed"),
      description: note || t("clientReports.sendFailed"),
    });
    return;
  }

  toast({
    title: t("clientReports.sendSuccess"),
    description: note || undefined,
  });
}

export function ClientReportsTab() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientReportBoardRow | null>(null);
  const [clientForm, setClientForm] = useState({
    recipientEmail: "",
    recipientPhone: "",
    useGlobalSections: true,
    dataSections: [] as ClientReportSection[],
  });
  const [formError, setFormError] = useState("");
  const [previewData, setPreviewData] = useState<ClientReportPayload | null>(null);
  const [busyClientId, setBusyClientId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["client-report-board"],
    queryFn: listClientReportBoard,
    retry: 1,
  });
  const { data: sectionsData } = useQuery({
    queryKey: ["client-report-sections"],
    queryFn: getClientReportSections,
  });

  const global = data?.global;
  const deliveryStatus = data?.deliveryStatus;
  const clientsLoadError = data?.clientsLoadError ?? (isError ? (error as Error)?.message : null);
  const clients = data?.clients ?? [];
  const paging = useClientTablePage(clients, String(clients.length));
  const sectionOptions = sectionsData?.sections ?? [];
  const pageIds = useMemo(() => paging.paged.map((r) => r.extClientId), [paging.paged]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => clients.some((c) => c.extClientId === id)));
  }, [clients]);

  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageIds.some((id) => selectedIds.includes(id));

  const saveClientMut = useMutation({
    mutationFn: async () => {
      if (!editingClient) return;
      const body = {
        recipientEmail: clientForm.recipientEmail.trim() || null,
        recipientPhone: clientForm.recipientPhone.trim() || null,
        dataSections: clientForm.useGlobalSections ? [] : clientForm.dataSections,
      };
      if (editingClient.configId) {
        return updateClientReportConfig(editingClient.configId, body);
      }
      return createClientReportConfig({
        extClientId: editingClient.extClientId,
        clientName: editingClient.clientName,
        enabled: editingClient.enabled,
        recipientEmail: body.recipientEmail,
        recipientPhone: body.recipientPhone,
        dataSections: clientForm.useGlobalSections ? [] : clientForm.dataSections,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-report-board"] });
      setClientDialogOpen(false);
      setEditingClient(null);
      setFormError("");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: ({ extClientId, enabled }: { extClientId: number; enabled: boolean }) =>
      toggleClientReportByExtId(extClientId, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-report-board"] }),
  });

  const previewMut = useMutation({
    mutationFn: (extClientId: number) => previewClientReportByExtId(extClientId),
    onSuccess: (payload) => {
      setPreviewData(payload);
      setPreviewOpen(true);
      setBusyClientId(null);
    },
    onError: () => setBusyClientId(null),
  });

  const sendMut = useMutation({
    mutationFn: (extClientId: number) => sendClientReportByExtId(extClientId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["client-report-board"] });
      notifyDeliveryResult(t, res);
      setBusyClientId(null);
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: t("clientReports.sendFailed"),
        description: e.message,
      });
      setBusyClientId(null);
    },
  });

  const openClientEdit = (row: ClientReportBoardRow) => {
    setEditingClient(row);
    setClientForm({
      recipientEmail: row.recipientEmail ?? row.effectiveEmail ?? "",
      recipientPhone: row.recipientPhone ?? row.effectivePhone ?? "",
      useGlobalSections: row.usesGlobalSections,
      dataSections: row.usesGlobalSections ? [...(global?.dataSections ?? [])] : [...row.effectiveSections],
    });
    setFormError("");
    setClientDialogOpen(true);
  };

  const toggleSection = (section: ClientReportSection) => {
    setClientForm((prev) => ({
      ...prev,
      dataSections: prev.dataSections.includes(section)
        ? prev.dataSections.filter((s) => s !== section)
        : [...prev.dataSections, section],
    }));
  };

  const activeCount = useMemo(() => clients.filter((c) => c.enabled).length, [clients]);

  function toggleSelectAllPage(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  }

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  async function bulkToggle(enabled: boolean) {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      for (const id of selectedIds) {
        await toggleClientReportByExtId(id, enabled);
      }
      await qc.invalidateQueries({ queryKey: ["client-report-board"] });
      toast({
        title: enabled
          ? t("clientReports.bulkEnabled", { count: selectedIds.length })
          : t("clientReports.bulkDisabled", { count: selectedIds.length }),
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: t("clientReports.sendFailed"),
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSend() {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    let fullOk = 0;
    let partialOrFail = 0;
    try {
      for (const id of selectedIds) {
        const res = await sendClientReportByExtId(id);
        const failed = (res.deliveryResults ?? []).some((r) => !r.delivered)
          || res.status === "failed"
          || res.delivered === false;
        if (failed) partialOrFail += 1;
        else fullOk += 1;
      }
      await qc.invalidateQueries({ queryKey: ["client-report-board"] });
      if (partialOrFail > 0) {
        toast({
          variant: "destructive",
          title: t("clientReports.bulkSendResult", {
            ok: fullOk,
            total: selectedIds.length,
            detail: "",
          }),
          description: t("clientReports.sendPartialTitle"),
        });
      } else {
        toast({
          title: t("clientReports.bulkSendResult", {
            ok: fullOk,
            total: selectedIds.length,
            detail: "",
          }),
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: t("clientReports.sendFailed"),
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {global && deliveryStatus && global.deliveryConfig ? (
        <ClientReportDeliveryChannels
          deliveryConfig={global.deliveryConfig}
          deliveryStatus={deliveryStatus}
        />
      ) : null}

      <section className="clients-table-card overflow-hidden">
        <DataTableToolbar
          className="flex-wrap"
          icon="/user.png"
          count={t("clientReports.toolbarAllClients", { total: clients.length, active: activeCount })}
          countLoading={isLoading}
          actions={
            selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#657491]">
                  {t("clientReports.selectedCount", { count: selectedIds.length })}
                </span>
                <Button type="button" size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkToggle(true)}>
                  {t("clientReports.bulkEnable")}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={bulkBusy} onClick={() => bulkToggle(false)}>
                  {t("clientReports.bulkDisable")}
                </Button>
                <Button type="button" size="sm" disabled={bulkBusy} onClick={() => void bulkSend()}>
                  {bulkBusy ? <Loader2 className="me-2 size-3.5 animate-spin" /> : <Send className="me-2 size-3.5" />}
                  {t("clientReports.bulkSend")}
                </Button>
              </div>
            ) : null
          }
        />

        {clientsLoadError ? (
          <p className="mx-5 mt-3 rounded-lg bg-[#fff8ee] px-3 py-2 text-sm text-[#b86a00]">{clientsLoadError}</p>
        ) : null}

        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <Table wrapClassName="clients-table-wrap" className="w-max min-w-full table-auto">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 whitespace-nowrap">
                    <Checkbox
                      checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                      onCheckedChange={(v) => toggleSelectAllPage(v === true)}
                      aria-label={t("clientReports.selectAll")}
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.client")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.contact")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.report")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.sendTime")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.nextSend")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("clientReports.col.active")}</TableHead>
                  <TableHead className="whitespace-nowrap text-end">{t("clientReports.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paging.paged.map((row) => (
                  <TableRow key={row.extClientId} data-state={selectedIds.includes(row.extClientId) ? "selected" : undefined}>
                    <TableCell className="whitespace-nowrap">
                      <Checkbox
                        checked={selectedIds.includes(row.extClientId)}
                        onCheckedChange={(v) => toggleRow(row.extClientId, v === true)}
                        aria-label={t("clientReports.selectRow", { name: row.clientName })}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-[#17356d]">
                      {row.clientName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <ClientReportContactCell
                        hasEmail={row.hasEmail}
                        hasPhone={row.hasPhone}
                        email={row.effectiveEmail}
                        phone={row.effectivePhone}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-nowrap items-center gap-1">
                        {row.effectiveSections.map((s) => (
                          <Badge key={s} variant="secondary" className="shrink-0 whitespace-nowrap text-[10px]">
                            {t(`clientReports.sections.${s}`)}
                          </Badge>
                        ))}
                        {row.usesGlobalSections ? (
                          <span className="shrink-0 whitespace-nowrap text-[10px] text-[#8a97b0]">
                            {t("clientReports.usesGlobal")}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatSendTime(row.sendTime)}</TableCell>
                    <TableCell className="whitespace-nowrap text-[13px] text-[#657491]">
                      {row.enabled ? formatNextSend(row.nextScheduledAt, i18n.language) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Switch
                        checked={row.enabled}
                        disabled={toggleMut.isPending}
                        onCheckedChange={(enabled) => toggleMut.mutate({ extClientId: row.extClientId, enabled })}
                        aria-label={t("clientReports.toggle")}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-nowrap justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          title={t("clientReports.editConfig")}
                          aria-label={t("clientReports.editConfig")}
                          className="text-[#1e4f8f] hover:text-[#1e4f8f]"
                          onClick={() => openClientEdit(row)}
                        >
                          <PenLine className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          title={t("clientReports.preview")}
                          aria-label={t("clientReports.preview")}
                          className="text-[#0f7a5c] hover:text-[#0f7a5c]"
                          disabled={busyClientId === row.extClientId}
                          onClick={() => {
                            setBusyClientId(row.extClientId);
                            previewMut.mutate(row.extClientId);
                          }}
                        >
                          {busyClientId === row.extClientId && previewMut.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          title={t("clientReports.sendNow", { defaultValue: "Send now" })}
                          aria-label={t("clientReports.sendNow", { defaultValue: "Send now" })}
                          className="text-[#c45c26] hover:text-[#c45c26]"
                          disabled={busyClientId === row.extClientId}
                          onClick={() => {
                            setBusyClientId(row.extClientId);
                            sendMut.mutate(row.extClientId);
                          }}
                        >
                          {busyClientId === row.extClientId && sendMut.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Send className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePageFooter
              total={paging.total}
              page={paging.page}
              pageSize={paging.pageSize}
              pageSizes={paging.pageSizes}
              loading={paging.busy}
              onPageChange={paging.setPage}
              onPageSizeChange={paging.setPageSize}
            />
          </>
        )}
      </section>

      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClient?.clientName}</DialogTitle>
            <DialogDescription>{t("clientReports.clientOverrideDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cr-email">{t("clientReports.field.email")}</Label>
              <Input
                id="cr-email"
                type="email"
                value={clientForm.recipientEmail}
                onChange={(e) => setClientForm((p) => ({ ...p, recipientEmail: e.target.value }))}
                placeholder={t("clientReports.field.emailPlaceholder")}
              />
              {editingClient?.sourceEmail ? (
                <p className="text-xs text-[#657491]">
                  {t("clientReports.field.sourceEmail", { email: editingClient.sourceEmail })}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-phone">{t("clientReports.field.phone")}</Label>
              <Input
                id="cr-phone"
                type="tel"
                value={clientForm.recipientPhone}
                onChange={(e) => setClientForm((p) => ({ ...p, recipientPhone: e.target.value }))}
                placeholder={t("clientReports.field.phonePlaceholder")}
              />
              {editingClient?.sourcePhone ? (
                <p className="text-xs text-[#657491]">
                  {t("clientReports.field.sourcePhone", { phone: editingClient.sourcePhone })}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label>{t("clientReports.useGlobalSections")}</Label>
              <Switch
                checked={clientForm.useGlobalSections}
                onCheckedChange={(useGlobalSections) => setClientForm((p) => ({
                  ...p,
                  useGlobalSections,
                  dataSections: useGlobalSections ? [...(global?.dataSections ?? [])] : p.dataSections,
                }))}
              />
            </div>
            {!clientForm.useGlobalSections ? (
              <div className="flex flex-wrap gap-2">
                {sectionOptions.map((section) => (
                  <Button
                    key={section}
                    type="button"
                    size="sm"
                    variant={clientForm.dataSections.includes(section) ? "default" : "outline"}
                    onClick={() => toggleSection(section)}
                  >
                    {t(`clientReports.sections.${section}`)}
                  </Button>
                ))}
              </div>
            ) : null}
            {formError ? <p className="text-sm text-loss">{formError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button type="button" disabled={saveClientMut.isPending} onClick={() => saveClientMut.mutate()}>
              {saveClientMut.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!inset-y-3 !start-auto !end-3 flex !h-auto !max-h-[calc(100vh-1.5rem)] !w-[min(96vw,72rem)] !max-w-[72rem] flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-[#e1e7f0] px-5 py-4 sm:px-6">
            <DialogTitle className="text-[#17356d]">
              {previewData?.title ?? t("clientReports.preview")}
            </DialogTitle>
            <DialogDescription>
              {previewData
                ? t("clientReports.previewMeta", {
                    client: previewData.client.name,
                    asOf: previewData.asOf,
                    from: previewData.from,
                    to: previewData.to,
                  })
                : t("clientReports.preview")}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {previewData ? <ClientReportPreview payload={previewData} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
