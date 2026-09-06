import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/phase1/SelectField";
import {
  listWhatsAppAccounts,
  updateClientReportDeliveryConfig,
  type ClientReportDeliveryConfig,
  type ClientReportDeliveryStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const DEFAULT_WASSENGER_URL = "https://api.wassenger.com/v1/messages";

type Props = {
  deliveryConfig: ClientReportDeliveryConfig;
  deliveryStatus: ClientReportDeliveryStatus;
};

type ChannelKey = "email" | "metaWhatsapp" | "wassenger";

const EMPTY_WASSENGER = {
  enabled: false,
  apiUrl: DEFAULT_WASSENGER_URL,
  apiToken: "",
  apiTokenSet: false,
};

function withDefaults(cfg: ClientReportDeliveryConfig): ClientReportDeliveryConfig {
  return {
    ...cfg,
    email: {
      ...cfg.email,
      smtpPassword: cfg.email.smtpPassword ?? "",
      smtpPasswordSet: Boolean(cfg.email.smtpPasswordSet),
    },
    // Keep Link Device off — channel is hidden from Client Reports.
    linkDevice: { ...cfg.linkDevice, enabled: false },
    wassenger: {
      ...EMPTY_WASSENGER,
      ...(cfg.wassenger ?? {}),
      apiUrl: cfg.wassenger?.apiUrl?.trim() || DEFAULT_WASSENGER_URL,
      apiToken: cfg.wassenger?.apiToken ?? "",
    },
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Config must be complete before the channel can be turned on. */
function canEnableEmail(
  email: ClientReportDeliveryConfig["email"],
  status?: ClientReportDeliveryStatus["email"],
): boolean {
  const host = email.smtpHost.trim();
  const user = email.smtpUser.trim();
  const from = email.smtpFrom.trim() || user;
  const port = Number(email.smtpPort) || 0;
  const hasPassword = Boolean(email.smtpPassword?.trim() || email.smtpPasswordSet || status?.smtpPasswordSet);
  return Boolean(host && user && from && port >= 1 && port <= 65535 && hasPassword);
}

function canEnableWassenger(
  wassenger: ClientReportDeliveryConfig["wassenger"] | undefined,
  status?: ClientReportDeliveryStatus["wassenger"],
): boolean {
  const w = { ...EMPTY_WASSENGER, ...(wassenger ?? {}) };
  const url = w.apiUrl.trim();
  const hasToken = Boolean(w.apiToken.trim() || w.apiTokenSet || status?.apiTokenSet);
  return Boolean(url && isValidHttpUrl(url) && hasToken);
}

function canEnableMeta(meta: ClientReportDeliveryConfig["metaWhatsapp"]): boolean {
  return Boolean(meta.configId?.trim());
}

function canEnableChannel(
  key: ChannelKey,
  cfg: ClientReportDeliveryConfig,
  status?: ClientReportDeliveryStatus,
): boolean {
  if (key === "email") return canEnableEmail(cfg.email, status?.email);
  if (key === "wassenger") return canEnableWassenger(cfg.wassenger, status?.wassenger);
  return canEnableMeta(cfg.metaWhatsapp);
}

export function ClientReportDeliveryChannels({ deliveryConfig, deliveryStatus }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState<ChannelKey | null>(null);
  const [form, setForm] = useState<ClientReportDeliveryConfig>(() => withDefaults(deliveryConfig));
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) return;
    setForm(withDefaults(deliveryConfig));
  }, [deliveryConfig, open]);

  const { data: waAccounts } = useQuery({
    queryKey: ["whatsapp-accounts"],
    queryFn: listWhatsAppAccounts,
  });

  const saveMut = useMutation({
    mutationFn: (next: ClientReportDeliveryConfig) => updateClientReportDeliveryConfig(withDefaults(next)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-report-board"] });
      setOpen(null);
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (next: ClientReportDeliveryConfig) => updateClientReportDeliveryConfig(withDefaults(next)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client-report-board"] }),
  });

  const accountOptions = useMemo(
    () => (waAccounts?.accounts ?? []).map((a) => ({
      value: a.id,
      label: `${a.label}${a.displayPhoneNumber ? ` · ${a.displayPhoneNumber}` : ""}`,
    })),
    [waAccounts?.accounts],
  );

  function openChannel(key: ChannelKey) {
    const next = withDefaults({ ...deliveryConfig });
    if (key === "email") {
      next.email = {
        ...next.email,
        smtpHost: next.email.smtpHost || "smtp.office365.com",
        smtpPort: next.email.smtpPort || 587,
        smtpUser: next.email.smtpUser || "qsc.research@qsc.qa",
        smtpFrom: next.email.smtpFrom || "qsc.research@qsc.qa",
        smtpSecure: false,
        smtpPassword: "",
      };
    }
    if (key === "wassenger") {
      next.wassenger = {
        ...EMPTY_WASSENGER,
        ...next.wassenger,
        apiUrl: next.wassenger.apiUrl || DEFAULT_WASSENGER_URL,
        apiToken: "",
      };
    }
    setForm(next);
    setError("");
    setOpen(key);
  }

  function toggleChannel(key: ChannelKey, enabled: boolean) {
    if (enabled && !canEnableChannel(key, deliveryConfig, deliveryStatus)) {
      setError(t("clientReports.delivery.enableBlocked"));
      openChannel(key);
      return;
    }
    const next = withDefaults({ ...deliveryConfig });
    if (key === "email") next.email = { ...next.email, enabled };
    if (key === "metaWhatsapp") next.metaWhatsapp = { ...next.metaWhatsapp, enabled };
    if (key === "wassenger") {
      next.wassenger = { ...(next.wassenger ?? EMPTY_WASSENGER), enabled };
    }
    toggleMut.mutate(next);
  }

  function setChannelEnabled(key: ChannelKey, enabled: boolean) {
    if (enabled && !canEnableChannel(key, form, deliveryStatus)) {
      setError(t("clientReports.delivery.enableBlocked"));
      return;
    }
    setError("");
    setForm((p) => {
      if (key === "email") return { ...p, email: { ...p.email, enabled } };
      if (key === "metaWhatsapp") return { ...p, metaWhatsapp: { ...p.metaWhatsapp, enabled } };
      return { ...p, wassenger: { ...(p.wassenger ?? EMPTY_WASSENGER), enabled } };
    });
  }

  function saveChannel() {
    if (!open) return;
    const next = withDefaults(form);
    // Keep DB consistent: port 587 never stores implicit SSL.
    if (next.email.smtpPort === 587) {
      next.email = { ...next.email, smtpSecure: false };
    }
    if (next.email.enabled && !canEnableEmail(next.email, deliveryStatus.email)) {
      next.email = { ...next.email, enabled: false };
      setError(t("clientReports.delivery.enableBlocked"));
      setForm(next);
      return;
    }
    if (next.wassenger.enabled && !canEnableWassenger(next.wassenger, deliveryStatus.wassenger)) {
      next.wassenger = { ...next.wassenger, enabled: false };
      setError(t("clientReports.delivery.enableBlocked"));
      setForm(next);
      return;
    }
    if (next.metaWhatsapp.enabled && !canEnableMeta(next.metaWhatsapp)) {
      next.metaWhatsapp = { ...next.metaWhatsapp, enabled: false };
      setError(t("clientReports.delivery.enableBlocked"));
      setForm(next);
      return;
    }
    saveMut.mutate(next);
  }

  const wassengerCfg = deliveryConfig.wassenger ?? EMPTY_WASSENGER;
  const wassengerStatus = deliveryStatus.wassenger ?? {
    ...EMPTY_WASSENGER,
    ready: false,
    configured: false,
  };

  const formEmailOk = canEnableEmail(form.email, deliveryStatus.email);
  const formWassengerOk = canEnableWassenger(form.wassenger, deliveryStatus.wassenger);
  const formMetaOk = canEnableMeta(form.metaWhatsapp);

  const cards = [
    {
      key: "email" as const,
      icon: Mail,
      title: t("clientReports.delivery.emailTitle"),
      desc: t("clientReports.delivery.emailDesc"),
      ready: deliveryStatus.email.ready,
      enabled: deliveryConfig.email.enabled,
      canEnable: canEnableEmail(deliveryConfig.email, deliveryStatus.email),
      statusLabel: deliveryStatus.email.ready
        ? t("clientReports.delivery.ready")
        : deliveryConfig.email.enabled
          ? t("clientReports.delivery.needsSetup")
          : t("clientReports.delivery.off"),
    },
    {
      key: "metaWhatsapp" as const,
      icon: MessageCircle,
      title: t("clientReports.delivery.metaTitle"),
      desc: t("clientReports.delivery.metaDesc"),
      ready: deliveryStatus.metaWhatsapp.ready,
      enabled: deliveryConfig.metaWhatsapp.enabled,
      canEnable: canEnableMeta(deliveryConfig.metaWhatsapp),
      statusLabel: deliveryStatus.metaWhatsapp.ready
        ? (deliveryStatus.metaWhatsapp.accountLabel ?? t("clientReports.delivery.connected"))
        : deliveryConfig.metaWhatsapp.enabled
          ? t("clientReports.delivery.needsSetup")
          : t("clientReports.delivery.off"),
    },
    {
      key: "wassenger" as const,
      icon: Send,
      title: t("clientReports.delivery.wassengerTitle"),
      desc: t("clientReports.delivery.wassengerDesc"),
      ready: wassengerStatus.ready,
      enabled: wassengerCfg.enabled,
      canEnable: canEnableWassenger(wassengerCfg, wassengerStatus),
      statusLabel: wassengerStatus.ready
        ? t("clientReports.delivery.ready")
        : wassengerCfg.enabled
          ? t("clientReports.delivery.needsSetup")
          : t("clientReports.delivery.off"),
    },
  ];

  return (
    <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="flex flex-col gap-3 rounded-[14px] border border-[#e1e7f0] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[#1e4f8f]">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#17356d]">{card.title}</h3>
                    <p className="text-[11px] text-[#657491]">{card.desc}</p>
                  </div>
                </div>
                <Badge variant={card.ready ? "default" : card.enabled ? "secondary" : "outline"}>
                  {card.statusLabel}
                </Badge>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#eef2f7] pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openChannel(card.key)}>
                    {t("clientReports.delivery.configure")}
                  </Button>
                  {card.key === "metaWhatsapp" ? (
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <Link href="/whatsapp">{t("clientReports.delivery.openWhatsApp")}</Link>
                    </Button>
                  ) : null}
                </div>
                <Switch
                  checked={card.enabled}
                  disabled={toggleMut.isPending || (!card.enabled && !card.canEnable)}
                  onCheckedChange={(enabled) => toggleChannel(card.key, enabled)}
                  aria-label={t("clientReports.delivery.enableChannel")}
                  title={!card.enabled && !card.canEnable ? t("clientReports.delivery.enableBlocked") : undefined}
                />
              </div>
            </div>
          );
        })}
      </section>

      <Dialog open={open === "email"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("clientReports.delivery.emailTitle")}</DialogTitle>
            <DialogDescription>{t("clientReports.delivery.emailDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>{t("clientReports.delivery.enableChannel")}</Label>
                {!formEmailOk ? (
                  <p className="text-[11px] text-[#b86a00]">{t("clientReports.delivery.enableBlocked")}</p>
                ) : null}
              </div>
              <Switch
                checked={form.email.enabled}
                disabled={!formEmailOk && !form.email.enabled}
                onCheckedChange={(enabled) => setChannelEnabled("email", enabled)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="smtp-host">{t("clientReports.delivery.smtpHost")}</Label>
                <Input
                  id="smtp-host"
                  value={form.email.smtpHost}
                  onChange={(e) => setForm((p) => ({ ...p, email: { ...p.email, smtpHost: e.target.value } }))}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">{t("clientReports.delivery.smtpPort")}</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={form.email.smtpPort}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    email: { ...p.email, smtpPort: Number(e.target.value) || 587 },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">{t("clientReports.delivery.smtpUser")}</Label>
                <Input
                  id="smtp-user"
                  value={form.email.smtpUser}
                  onChange={(e) => setForm((p) => ({ ...p, email: { ...p.email, smtpUser: e.target.value } }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="smtp-from">{t("clientReports.delivery.smtpFrom")}</Label>
                <Input
                  id="smtp-from"
                  value={form.email.smtpFrom}
                  onChange={(e) => setForm((p) => ({ ...p, email: { ...p.email, smtpFrom: e.target.value } }))}
                  placeholder="qsc.research@qsc.qa"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="smtp-password">{t("clientReports.delivery.smtpPassword")}</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.email.smtpPassword ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, email: { ...p.email, smtpPassword: e.target.value } }))}
                  placeholder={form.email.smtpPasswordSet
                    ? t("clientReports.delivery.secretKeptPlaceholder")
                    : t("clientReports.delivery.smtpPasswordPlaceholder")}
                />
                <p className="text-xs text-[#657491]">
                  {form.email.smtpPasswordSet
                    ? t("clientReports.delivery.smtpPasswordSetHint")
                    : t("clientReports.delivery.smtpPasswordHint")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>{t("clientReports.delivery.smtpSecure")}</Label>
                <p className="text-[11px] text-[#657491]">{t("clientReports.delivery.smtpSecureHint")}</p>
              </div>
              <Switch
                checked={form.email.smtpPort === 465 ? true : form.email.smtpSecure}
                disabled={form.email.smtpPort === 587}
                onCheckedChange={(smtpSecure) => setForm((p) => ({
                  ...p,
                  email: {
                    ...p.email,
                    smtpSecure,
                    ...(smtpSecure && p.email.smtpPort === 587 ? { smtpPort: 465 } : {}),
                  },
                }))}
              />
            </div>
            {error ? <p className="text-sm text-loss">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(null)}>{t("common.cancel")}</Button>
            <Button type="button" disabled={saveMut.isPending} onClick={() => saveChannel()}>
              {saveMut.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "metaWhatsapp"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("clientReports.delivery.metaTitle")}</DialogTitle>
            <DialogDescription>{t("clientReports.delivery.metaDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>{t("clientReports.delivery.enableChannel")}</Label>
                {!formMetaOk ? (
                  <p className="text-[11px] text-[#b86a00]">{t("clientReports.delivery.enableBlocked")}</p>
                ) : null}
              </div>
              <Switch
                checked={form.metaWhatsapp.enabled}
                disabled={!formMetaOk && !form.metaWhatsapp.enabled}
                onCheckedChange={(enabled) => setChannelEnabled("metaWhatsapp", enabled)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("clientReports.delivery.metaAccount")}</Label>
              <SelectField
                value={form.metaWhatsapp.configId ?? ""}
                onValueChange={(configId) => setForm((p) => ({
                  ...p,
                  metaWhatsapp: { ...p.metaWhatsapp, configId: configId || null },
                }))}
                options={[
                  { value: "", label: t("clientReports.delivery.selectAccount") },
                  ...accountOptions,
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wa-template">{t("clientReports.delivery.templateName")}</Label>
              <Input
                id="wa-template"
                value={form.metaWhatsapp.templateName ?? ""}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  metaWhatsapp: { ...p.metaWhatsapp, templateName: e.target.value || null },
                }))}
                placeholder={t("clientReports.delivery.templatePlaceholder")}
              />
            </div>
            {error ? <p className="text-sm text-loss">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(null)}>{t("common.cancel")}</Button>
            <Button type="button" disabled={saveMut.isPending} onClick={() => saveChannel()}>
              {saveMut.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "wassenger"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("clientReports.delivery.wassengerTitle")}</DialogTitle>
            <DialogDescription>{t("clientReports.delivery.wassengerDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wassenger-url">{t("clientReports.delivery.wassengerApiUrl")}</Label>
              <Input
                id="wassenger-url"
                value={form.wassenger?.apiUrl ?? DEFAULT_WASSENGER_URL}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  wassenger: {
                    ...(p.wassenger ?? EMPTY_WASSENGER),
                    apiUrl: e.target.value || DEFAULT_WASSENGER_URL,
                    enabled: p.wassenger?.enabled
                      ? canEnableWassenger({
                        ...(p.wassenger ?? EMPTY_WASSENGER),
                        apiUrl: e.target.value || DEFAULT_WASSENGER_URL,
                      }, deliveryStatus.wassenger)
                      : false,
                  },
                }))}
                placeholder={DEFAULT_WASSENGER_URL}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wassenger-token">{t("clientReports.delivery.wassengerApiToken")}</Label>
              <Input
                id="wassenger-token"
                type="password"
                autoComplete="new-password"
                value={form.wassenger?.apiToken ?? ""}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  wassenger: {
                    ...(p.wassenger ?? EMPTY_WASSENGER),
                    apiToken: e.target.value,
                    enabled: p.wassenger?.enabled
                      ? canEnableWassenger({
                        ...(p.wassenger ?? EMPTY_WASSENGER),
                        apiToken: e.target.value,
                      }, deliveryStatus.wassenger)
                      : false,
                  },
                }))}
                placeholder={form.wassenger?.apiTokenSet
                  ? t("clientReports.delivery.secretKeptPlaceholder")
                  : t("clientReports.delivery.wassengerTokenPlaceholder")}
              />
              <p className="text-xs text-[#657491]">
                {form.wassenger?.apiTokenSet
                  ? t("clientReports.delivery.wassengerTokenSetHint")
                  : t("clientReports.delivery.wassengerEnvHint")}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#eef2f7] pt-3">
              <div>
                <Label>{t("clientReports.delivery.enableChannel")}</Label>
                {!formWassengerOk ? (
                  <p className="text-[11px] text-[#b86a00]">{t("clientReports.delivery.enableBlocked")}</p>
                ) : null}
              </div>
              <Switch
                checked={form.wassenger?.enabled ?? false}
                disabled={!formWassengerOk && !(form.wassenger?.enabled ?? false)}
                onCheckedChange={(enabled) => setChannelEnabled("wassenger", enabled)}
              />
            </div>
            {error ? <p className="text-sm text-loss">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(null)}>{t("common.cancel")}</Button>
            <Button type="button" disabled={saveMut.isPending} onClick={() => saveChannel()}>
              {saveMut.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContactPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold",
        ok ? "bg-[#eef8f2] text-[#159957]" : "bg-[#f3f5f9] text-[#8a97b0]",
      )}
    >
      <span className={cn("size-1.5 rounded-full", ok ? "bg-[#159957]" : "bg-[#c5cede]")} />
      {label}
    </span>
  );
}

export function ClientReportContactCell({
  hasEmail,
  hasPhone,
  email,
  phone,
}: {
  hasEmail: boolean;
  hasPhone: boolean;
  email: string | null;
  phone: string | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
      <ContactPill
        ok={hasEmail}
        label={hasEmail ? (email ?? t("clientReports.contact.yes")) : t("clientReports.contact.noEmail")}
      />
      <ContactPill
        ok={hasPhone}
        label={hasPhone ? (phone ?? t("clientReports.contact.yes")) : t("clientReports.contact.noPhone")}
      />
    </div>
  );
}
