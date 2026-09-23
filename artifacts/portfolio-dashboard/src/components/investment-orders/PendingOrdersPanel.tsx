import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox } from "lucide-react";
import { EmptyState } from "@/components/phase1/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyTickerIcon } from "@/components/phase1/CompanyTickerIcon";
import { formatQty } from "@/components/statements/StatementPreview";
import { getPendingOrdersBoard } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoardBadge, BoardSection, SidePill, boardCellPy, boardTh } from "./OrdersBoardChrome";

/** Live board, so it follows the market on the same cadence as the order list. */
const POLL_MS = 15_000;

/** One row per symbol × side, as agreed with the Investment Manager. */
export function PendingOrdersPanel({
  selectedTicker,
  onTickerClick,
}: {
  selectedTicker: string;
  onTickerClick: (ticker: string, side: "Buy" | "Sell") => void;
}) {
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pending-board"],
    queryFn: getPendingOrdersBoard,
    refetchInterval: POLL_MS,
  });

  const rows = data?.rows ?? [];

  return (
    <BoardSection
      title={t("ordersBoard.pending.title")}
      subtitle={t("ordersBoard.pending.subtitle")}
      end={
        <div className="flex gap-2">
          <BoardBadge tone="buy">{t("ordersBoard.pending.buyCount", { count: data?.buyOrderCount ?? 0 })}</BoardBadge>
          <BoardBadge tone="sell">
            {t("ordersBoard.pending.sellCount", { count: data?.sellOrderCount ?? 0 })}
          </BoardBadge>
        </div>
      }
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          className="py-10"
          icon={<AlertTriangle className="h-10 w-10" />}
          title={t("ordersBoard.pending.errorTitle")}
          description={(error as Error | undefined)?.message || t("investmentOrders.errorDesc")}
        />
      ) : !rows.length ? (
        <EmptyState
          className="py-10"
          icon={<Inbox className="h-10 w-10" />}
          title={t("ordersBoard.pending.emptyTitle")}
          description={data?.warning || t("ordersBoard.pending.emptyDesc")}
        />
      ) : (
        <div className="clients-table-wrap max-h-[22rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={boardTh}>{t("ordersBoard.col.logo")}</TableHead>
                <TableHead className={boardTh}>{t("ordersBoard.col.symbol")}</TableHead>
                <TableHead className={boardTh}>{t("ordersBoard.col.tickerName")}</TableHead>
                <TableHead className={boardTh}>{t("ordersBoard.col.side")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.qty")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.exeQty")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.remain")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={`${row.ticker}-${row.side}`}
                  className={cn(
                    "cursor-pointer hover:bg-[#f4f7fd]",
                    selectedTicker === row.ticker.toUpperCase() && "bg-[#fffbef]",
                  )}
                  onClick={() => onTickerClick(row.ticker, row.side)}
                >
                  <TableCell style={boardCellPy} className="px-3">
                    <CompanyTickerIcon ticker={row.ticker} companyName={row.companyName ?? undefined} />
                  </TableCell>
                  <TableCell style={boardCellPy} className="px-3 font-mono font-bold text-[#16305f]">
                    {row.ticker}
                  </TableCell>
                  <TableCell style={boardCellPy} className="px-3 text-[#42506b]">
                    {row.ticker} ( {row.orderCount} )
                  </TableCell>
                  <TableCell style={boardCellPy} className="px-3">
                    <SidePill
                      side={row.side}
                      buyLabel={t("ordersBoard.side.buy")}
                      sellLabel={t("ordersBoard.side.sell")}
                    />
                  </TableCell>
                  <TableCell style={boardCellPy} className="px-3 text-end font-data">{formatQty(row.qty)}</TableCell>
                  <TableCell style={boardCellPy} className="px-3 text-end font-data">
                    {formatQty(row.executedQty)}
                  </TableCell>
                  <TableCell style={boardCellPy} className="px-3 text-end font-data font-semibold">
                    {formatQty(row.remainQty)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </BoardSection>
  );
}
