import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox } from "lucide-react";
import { EmptyState } from "@/components/phase1/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatQar } from "@/components/statements/StatementPreview";
import { getOrderBalances } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoardBadge, BoardSection, boardCellPy, boardTh } from "./OrdersBoardChrome";

/**
 * Cash for every client on the board. The figure is the cash ledger balance —
 * whether "available" should also net off open buy orders is still with the
 * client, so the panel says which basis it is showing.
 */
export function AvailableBalancesPanel({
  asOf,
  selectedClientId,
  onClientClick,
}: {
  asOf: string;
  selectedClientId: string;
  onClientClick: (clientId: number) => void;
}) {
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders-balances", asOf],
    queryFn: () => getOrderBalances(asOf),
  });

  const rows = data?.rows ?? [];

  return (
    <BoardSection
      title={t("ordersBoard.balances.title")}
      subtitle={t("ordersBoard.balances.subtitle")}
      end={<BoardBadge>{rows.length}</BoardBadge>}
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          className="py-10"
          icon={<AlertTriangle className="h-10 w-10" />}
          title={t("ordersBoard.balances.errorTitle")}
          description={(error as Error | undefined)?.message || t("investmentOrders.errorDesc")}
        />
      ) : !rows.length ? (
        <EmptyState
          className="py-10"
          icon={<Inbox className="h-10 w-10" />}
          title={t("ordersBoard.balances.emptyTitle")}
          description={t("ordersBoard.balances.emptyDesc")}
        />
      ) : (
        <>
          <div className="clients-table-wrap max-h-[22rem] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={boardTh}>{t("ordersBoard.col.client")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.nin")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.availableBalance")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.clientId}
                    className={cn(
                      "cursor-pointer hover:bg-[#f4f7fd]",
                      selectedClientId === String(row.clientId) && "bg-[#eef3ff]",
                    )}
                    onClick={() => onClientClick(row.clientId)}
                  >
                    <TableCell style={boardCellPy} className="px-3 font-semibold text-[#16305f]">
                      {row.clientName}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 font-data text-[#657491]">
                      {row.nin || "—"}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data font-semibold">
                      {formatQar(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="px-4 py-2 text-[11px] text-[#8a97ad]">{t("ordersBoard.balances.basisNote")}</p>
        </>
      )}
    </BoardSection>
  );
}
