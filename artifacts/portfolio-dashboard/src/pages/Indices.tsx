import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/phase1/PageHeader";
import { QuoteBoard, quoteLogoLabel } from "@/components/phase1/QuoteBoard";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { SelectField } from "@/components/phase1/SelectField";
import {
  getIndices,
  deleteIndex,
  type IndexData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { IndexConstituentsDialog } from "@/components/IndexConstituentsDialog";
import { IndexExcelUploadControls } from "@/components/IndexDataPointDialog";
import { Upload, Trash2, Layers } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";

function UploadIndexDialog({ indices, queryClient }: { indices: IndexData[]; queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [uploadIndexId, setUploadIndexId] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setUploadIndexId(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="w-4 h-4 me-2" /> {t("common.uploadData")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("indices.uploadData")}</DialogTitle>
          <DialogDescription>{t("indices.uploadDataDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("indices.targetIndex")}</Label>
            <SelectField
              className="w-full font-mono"
              value={uploadIndexId}
              onValueChange={setUploadIndexId}
              placeholder={t("common.selectIndex")}
              options={[{ value: "", label: t("common.selectIndex") }, ...indices.map((idx) => ({ value: idx.id, label: idx.name }))]}
            />
          </div>
          {uploadIndexId ? (
            <IndexExcelUploadControls
              indexId={uploadIndexId}
              onDone={() => {
                queryClient.invalidateQueries({ queryKey: ["indices"] });
                queryClient.invalidateQueries({ queryKey: ["index", uploadIndexId] });
                setOpen(false);
                setUploadIndexId("");
              }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">{t("indices.selectIndexHint")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Indices() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [cardConstituents, setCardConstituents] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();
  const { role, username } = useAuth();
  const canMutate = canPerformAction("stock.mutate", { role, username });
  const canDelete = canPerformAction("stock.delete", { role, username });
  const { data: indices = [], isLoading } = useQuery({ queryKey: ["indices"], queryFn: getIndices });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteIndex(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["indices"] }); setDeleteTarget(null); },
  });

  const filtered = indices.filter((idx) =>
    (idx.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (idx.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const advancing = indices.filter((idx) => (idx.dayChangePct || 0) >= 0).length;
  const declining = indices.length - advancing;

  return (
    <Shell>
      <PageHeader
        title={t("indices.title")}
        description={t("indices.description")}
        actions={
          <>
            {canMutate && <UploadIndexDialog indices={indices} queryClient={queryClient} />}
            {canMutate && <IndexConstituentsDialog indices={indices} />}
          </>
        }
      />

      <StatsSummaryBar
        className="mb-6"
        ariaLabel={t("indices.title")}
        loading={isLoading}
        columns={3}
        items={[
          {
            id: "series",
            icon: "/bar-chart.png",
            label: t("indices.seriesCount"),
            value: <AnimatedNumber value={indices.length} format="integer" />,
            hint: t("indices.points"),
          },
          {
            id: "up",
            icon: "/growth.png",
            label: t("indices.advancing"),
            value: <AnimatedNumber value={advancing} format="integer" />,
            hint: "",
            valueClassName: "text-[var(--color-positive)]",
          },
          {
            id: "down",
            icon: "/warning.png",
            label: t("indices.declining"),
            value: <AnimatedNumber value={declining} format="integer" />,
            hint: "",
            valueClassName: declining ? "text-loss" : undefined,
          },
        ]}
      />

      <QuoteBoard
        title={t("indices.title")}
        subtitle={t("indices.description")}
        icon="/analytics.png"
        loading={isLoading}
        emptyTitle={search ? t("indices.emptySearchTitle") : t("indices.emptyTitle")}
        emptyDescription={search ? t("indices.emptySearchDesc") : t("indices.emptyDesc")}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("indices.searchPlaceholder")}
        searchLabel={t("indices.searchPlaceholder")}
        hotkey
        columns={{
          asset: t("dashboard.colAsset"),
          trend: t("dashboard.colTrend"),
          price: t("indices.value"),
          day: t("dashboard.colDay"),
        }}
        rows={filtered.map((idx) => ({
          id: idx.id,
          href: `/indices/${idx.id}`,
          logo: quoteLogoLabel(idx.name),
          title: idx.name,
          subtitle: idx.description || t("common.noDescription"),
          sparkline: idx.sparkline || [],
          price: (idx.currentValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          dayPct: idx.dayChangePct,
          actions: (canMutate || canDelete) ? (
            <>
              {canMutate ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title={t("indices.manageConstituents")}
                  onClick={() => setCardConstituents({ id: idx.id, name: idx.name })}
                >
                  <Layers className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400"
                  onClick={() => setDeleteTarget({ id: idx.id, name: idx.name })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </>
          ) : null,
        }))}
      />

      <IndexConstituentsDialog
        fixedIndexId={cardConstituents?.id}
        fixedIndexName={cardConstituents?.name}
        open={!!cardConstituents}
        onOpenChange={(v) => { if (!v) setCardConstituents(null); }}
        hideTrigger
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        isPending={deleteMut.isPending}
      />
    </Shell>
  );
}
