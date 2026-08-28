import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import { getUatStatus } from "@/lib/api";

export default function UatGate() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["uat-status"],
    queryFn: getUatStatus,
  });

  return (
    <Shell>
      <PageHeader title={t("uat.title")} description={t("uat.description")} />
      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <EmptyState
          icon={<ListChecks className="h-8 w-8 text-muted-foreground" />}
          title={t("uat.emptyTitle")}
          description={t("uat.emptyDesc")}
        />
      )}
      <BlockedBoardTable rows={data?.rows ?? []} askPrefix="uat.ask" />
    </Shell>
  );
}
