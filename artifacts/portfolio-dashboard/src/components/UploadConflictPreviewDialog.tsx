import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Loader2 } from "lucide-react";
import { SelectField } from "@/components/phase1/SelectField";

export type ConflictDecision = "overwrite" | "skip";

type ConflictItem = {
  date: string;
  currentLabel: string;
  incomingLabel: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  newCount: number;
  conflicts: ConflictItem[];
  committing?: boolean;
  onConfirm: (decisions: Record<string, ConflictDecision>) => void;
};

export function UploadConflictPreviewDialog({
  open,
  onOpenChange,
  title,
  newCount,
  conflicts,
  committing = false,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [decisions, setDecisions] = useState<Record<string, ConflictDecision>>({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, ConflictDecision> = {};
    for (const c of conflicts) next[c.date] = "overwrite";
    setDecisions(next);
  }, [open, conflicts]);

  const overwriteCount = useMemo(
    () => Object.values(decisions).filter((d) => d === "overwrite").length,
    [decisions]
  );
  const skipCount = conflicts.length - overwriteCount;
  const paging = useClientTablePage(conflicts, String(conflicts.length));

  const setAll = (decision: ConflictDecision) => {
    const next: Record<string, ConflictDecision> = {};
    for (const c of conflicts) next[c.date] = decision;
    setDecisions(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("dialogs.uploadConflict.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Badge variant="outline" className="font-mono">{t("dialogs.uploadConflict.newCount", { count: newCount })}</Badge>
          <Badge variant="outline" className="font-mono border-amber-500/40 text-amber-600">
            {t("dialogs.uploadConflict.conflictsCount", { count: conflicts.length })}
          </Badge>
          <Badge variant="outline" className="font-mono">{t("dialogs.uploadConflict.overwriteCount", { count: overwriteCount })}</Badge>
          <Badge variant="outline" className="font-mono">{t("dialogs.uploadConflict.skipCount", { count: skipCount })}</Badge>
          <div className="ms-auto flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setAll("overwrite")}>
              {t("dialogs.uploadConflict.overwriteAll")}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setAll("skip")}>
              {t("dialogs.uploadConflict.skipAll")}
            </Button>
          </div>
        </div>

        {conflicts.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              {t("dialogs.uploadConflict.noConflicts", { count: newCount })}
            </p>
          ) : (
            <AppTable className="min-h-0 flex-1" footer={<ClientTableFooter paging={paging} />}>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs uppercase">{t("common.date")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("dialogs.uploadConflict.colCurrent")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("dialogs.uploadConflict.colIncoming")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-end">{t("dialogs.uploadConflict.colAction")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paging.paged.map((c) => (
                  <TableRow key={c.date}>
                    <TableCell className="font-mono text-sm">{c.date}</TableCell>
                    <TableCell className="text-end font-data text-sm text-muted-foreground">{c.currentLabel}</TableCell>
                    <TableCell className="text-end font-data text-sm font-semibold">{c.incomingLabel}</TableCell>
                    <TableCell className="text-end">
                      <SelectField
                        className="h-8 min-w-28"
                        value={decisions[c.date] || "overwrite"}
                        onValueChange={(v) =>
                          setDecisions((prev) => ({
                            ...prev,
                            [c.date]: v as ConflictDecision,
                          }))
                        }
                        options={[
                          { value: "overwrite", label: t("common.overwrite") },
                          { value: "skip", label: t("common.skip") },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </AppTable>
          )}

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={committing}>
            {t("common.cancel")}
          </Button>
          <Button
            disabled={committing || (newCount === 0 && overwriteCount === 0)}
            onClick={() => onConfirm(decisions)}
          >
            {committing ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
            {t("dialogs.uploadConflict.confirmRows", { count: newCount + overwriteCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
