/** Shared blocked-question table. Display only — not a sign-off. */

import { useTranslation } from "react-i18next";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";

export type BlockedBoardRow = {
  id: string;
  handoverQuestion: number | null;
  codeToday: string;
};

export function BlockedBoardTable({
  rows,
  askPrefix,
}: {
  rows: BlockedBoardRow[];
  askPrefix: string;
}) {
  const { t } = useTranslation();
  const paging = useClientTablePage(rows, `${askPrefix}|${rows.length}`);
  if (rows.length === 0) return null;

  return (
    <AppTable className="mt-6" footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
          <TableRow>
            <TableHead>{t("blockedBoard.col.id")}</TableHead>
            <TableHead>{t("blockedBoard.col.q")}</TableHead>
            <TableHead>{t("blockedBoard.col.ask")}</TableHead>
            <TableHead>{t("blockedBoard.col.code")}</TableHead>
            <TableHead>{t("blockedBoard.col.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paging.paged.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-[12px]">{row.id}</TableCell>
              <TableCell className="font-mono text-[12px]">{row.handoverQuestion ?? t("common.na")}</TableCell>
              <TableCell>{t(`${askPrefix}.${row.id}`)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.codeToday}</TableCell>
              <TableCell className="font-mono text-[11px] uppercase text-muted-foreground">
                {t("blockedBoard.blocked")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </AppTable>
  );
}
