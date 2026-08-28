import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { getLiveStatus } from "@/lib/api";

export default function LiveMarket() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["live-status"],
    queryFn: getLiveStatus,
  });

  const objects = data?.objectsNamedByQsc ?? [];

  return (
    <Shell>
      <PageHeader title={t("live.title")} description={t("live.description")} />
      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <EmptyState
          icon={<Radio className="h-8 w-8 text-muted-foreground" />}
          title={t("live.emptyTitle")}
          description={t(`live.reason.${data?.blockedReason ?? "NO_BROADCAST_WS_URL"}`)}
        />
      )}
      {objects.length > 0 ? (
        <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {objects.map((name) => (
            <li key={name} className="rounded-lg border border-border/70 bg-card/80 px-3 py-2 font-mono text-[12px]">
              {t(`live.objects.${name}`)}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-6 text-sm text-muted-foreground">{t("live.valuationNote")}</p>
      <ol className="mt-6 list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
        <li>{t("live.ask.q23")}</li>
        <li>{t("live.ask.q24")}</li>
        <li>{t("live.ask.q25")}</li>
        <li>{t("live.ask.q26")}</li>
      </ol>
    </Shell>
  );
}
