import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Redirect } from "wouter";
import { Building2, Bell, Plug } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import { canAccessPath } from "@/lib/access";
import { ClientReportsTab } from "@/components/settings/ClientReportsTab";
import { ClientReportGlobalBar } from "@/components/settings/ClientReportGlobalBar";

const SETTINGS_TABS = ["clientReports", "company", "notifications", "integrations"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function initialTab(): SettingsTab {
  const raw = new URLSearchParams(window.location.search).get("tab");
  return SETTINGS_TABS.includes(raw as SettingsTab) ? (raw as SettingsTab) : "clientReports";
}

function ComingSoonPanel({
  icon,
  titleKey,
  descKey,
}: {
  icon: ReactNode;
  titleKey: string;
  descKey: string;
}) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={icon}
      title={t(titleKey)}
      description={t(descKey)}
    />
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const allowed = canAccessPath("/settings", { role, username });
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  if (!allowed) return <Redirect to="/" />;

  function onTabChange(next: string) {
    const value = SETTINGS_TABS.includes(next as SettingsTab) ? (next as SettingsTab) : "clientReports";
    setTab(value);
    const url = new URL(window.location.href);
    if (value === "clientReports") url.searchParams.delete("tab");
    else url.searchParams.set("tab", value);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  return (
    <Shell>
      <PageHeader
        className="!mt-4"
        title={t("settingsPage.title")}
        description={t("settingsPage.description")}
        actions={tab === "clientReports" ? <ClientReportGlobalBar /> : null}
      />

      <Tabs value={tab} onValueChange={onTabChange} className="cdp-data">
        <CdpTabsList value={tab} className="mb-5">
          <TabsTrigger value="clientReports" className={CDP_TAB}>
            {t("settingsPage.tabs.clientReports")}
          </TabsTrigger>
          <TabsTrigger value="company" className={CDP_TAB}>
            {t("settingsPage.tabs.company")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className={CDP_TAB}>
            {t("settingsPage.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="integrations" className={CDP_TAB}>
            {t("settingsPage.tabs.integrations")}
          </TabsTrigger>
        </CdpTabsList>

        <TabsContent value="clientReports" className="mt-0">
          <ClientReportsTab />
        </TabsContent>

        <TabsContent value="company" className="mt-0">
          <ComingSoonPanel
            icon={<Building2 className="h-8 w-8 text-[#1a4cc4]" />}
            titleKey="settingsPage.comingSoon.companyTitle"
            descKey="settingsPage.comingSoon.companyDesc"
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <ComingSoonPanel
            icon={<Bell className="h-8 w-8 text-[#1a4cc4]" />}
            titleKey="settingsPage.comingSoon.notificationsTitle"
            descKey="settingsPage.comingSoon.notificationsDesc"
          />
        </TabsContent>

        <TabsContent value="integrations" className="mt-0">
          <ComingSoonPanel
            icon={<Plug className="h-8 w-8 text-[#1a4cc4]" />}
            titleKey="settingsPage.comingSoon.integrationsTitle"
            descKey="settingsPage.comingSoon.integrationsDesc"
          />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
