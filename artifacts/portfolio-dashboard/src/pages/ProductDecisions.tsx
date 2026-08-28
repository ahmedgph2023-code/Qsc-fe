import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import { getProductDecisions } from "@/lib/api";

export default function ProductDecisions() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["product-decisions"],
    queryFn: getProductDecisions,
  });

  return (
    <Shell>
      <PageHeader title={t("productDecisions.title")} description={t("productDecisions.description")} />
      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
          title={t("productDecisions.emptyTitle")}
          description={t("productDecisions.emptyDesc")}
        />
      )}
      <BlockedBoardTable rows={data?.rows ?? []} askPrefix="productDecisions.ask" />
    </Shell>
  );
}
