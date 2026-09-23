import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox } from "lucide-react";
import { EmptyState } from "@/components/phase1/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TickerLabel } from "@/components/phase1/CompanyTickerIcon";
import { formatQar, formatQty, formatStatementAmount } from "@/components/statements/StatementPreview";
import { getExecutionsSummary, type ExecutionSummaryRow, type ExecutionsView } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoardSection, boardCellPy, boardTh } from "./OrdersBoardChrome";

const VIEWS: ExecutionsView[] = ["client_stock", "stock", "client"];

const BUY_TEXT = "text-[#1a7f4b]";
const SELL_TEXT = "text-[#b42318]";

/** Sell/buy averages print at three decimals; values at two. */
const price = (n: number | null) => (n == null ? "—" : formatStatementAmount(n));

export function DailyExecutionsPanel({
  asOf,
  view,
  onViewChange,
  onClientClick,
  onTickerClick,
}: {
  asOf: string;
  view: ExecutionsView;
  onViewChange: (view: ExecutionsView) => void;
  onClientClick: (row: ExecutionSummaryRow) => void;
  onTickerClick: (ticker: string) => void;
}) {
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["executions-summary", asOf, view],
    queryFn: () => getExecutionsSummary(asOf, view),
  });

  const rows = data?.rows ?? [];
  const showClient = view !== "stock";
  const showStock = view !== "client";
  // The combined view prints "إجمالي {client}" after each client's rows.
  const subtotalFor = (clientId: number | null) =>
    view === "client_stock" ? data?.clientSubtotals.find((s) => s.clientId === clientId) : undefined;
  const isLastOfClient = (index: number) =>
    rows[index]?.clientId != null && rows[index]!.clientId !== rows[index + 1]?.clientId;

  const numericCells = (row: ExecutionSummaryRow, bold = false) => (
    <>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data font-bold", bold && "text-[13px]")}>
        {formatQar(row.totalValue)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", SELL_TEXT)}>
        {price(row.avgSellPrice)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", SELL_TEXT, bold && "font-bold")}>
        {formatQar(row.sellValue)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", SELL_TEXT)}>
        {formatQty(row.sellQty)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", BUY_TEXT)}>
        {price(row.avgBuyPrice)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", BUY_TEXT, bold && "font-bold")}>
        {formatQar(row.buyValue)}
      </TableCell>
      <TableCell style={boardCellPy} className={cn("px-3 text-end font-data", BUY_TEXT)}>
        {formatQty(row.buyQty)}
      </TableCell>
    </>
  );

  return (
    <BoardSection
      title={t("ordersBoard.executions.title")}
      subtitle={t("ordersBoard.executions.subtitle")}
      end={
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[11px] font-bold transition",
                v === view ? "bg-[#e3b341] text-[#16305f]" : "bg-[#24406f] text-[#c7d6f0] hover:bg-[#2d4d84]",
              )}
            >
              {t(`ordersBoard.executions.view.${v}`)}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          className="py-12"
          icon={<AlertTriangle className="h-10 w-10" />}
          title={t("ordersBoard.executions.errorTitle")}
          description={(error as Error | undefined)?.message || t("investmentOrders.errorDesc")}
        />
      ) : !rows.length ? (
        <EmptyState
          className="py-12"
          icon={<Inbox className="h-10 w-10" />}
          title={t("ordersBoard.executions.emptyTitle")}
          description={t("ordersBoard.executions.emptyDesc")}
        />
      ) : (
        <div className="clients-table-wrap overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {showClient ? <TableHead className={boardTh}>{t("ordersBoard.col.client")}</TableHead> : null}
                {showClient ? <TableHead className={boardTh}>{t("ordersBoard.col.nin")}</TableHead> : null}
                {showStock ? <TableHead className={boardTh}>{t("ordersBoard.col.stock")}</TableHead> : null}
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.totalTraded")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.avgSellPrice")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.sellValue")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.sellQty")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.avgBuyPrice")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.buyValue")}</TableHead>
                <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.buyQty")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const subtotal = isLastOfClient(index) ? subtotalFor(row.clientId) : undefined;
                return (
                  <Fragment key={`${row.clientId}-${row.ticker}-${index}`}>
                    <TableRow className="hover:bg-[#f4f7fd]">
                      {showClient ? (
                        <TableCell style={boardCellPy} className="px-3">
                          <button
                            type="button"
                            className="font-semibold text-[#16305f] hover:underline"
                            onClick={() => onClientClick(row)}
                          >
                            {row.clientName || "—"}
                          </button>
                        </TableCell>
                      ) : null}
                      {showClient ? (
                        <TableCell style={boardCellPy} className="px-3 font-data text-[#657491]">
                          {row.nin || "—"}
                        </TableCell>
                      ) : null}
                      {showStock ? (
                        <TableCell style={boardCellPy} className="px-3">
                          <button type="button" onClick={() => onTickerClick(row.ticker ?? "")}>
                            <TickerLabel ticker={row.ticker ?? "—"} companyName={row.companyName} />
                          </button>
                        </TableCell>
                      ) : null}
                      {numericCells(row)}
                    </TableRow>
                    {subtotal ? (
                      <TableRow className="bg-[#eef3ff]">
                        <TableCell
                          colSpan={showStock ? 3 : 2}
                          style={boardCellPy}
                          className="px-3 text-[12px] font-semibold text-[#42506b]"
                        >
                          {t("ordersBoard.executions.clientTotal", { name: subtotal.clientName ?? "" })}
                        </TableCell>
                        {numericCells(subtotal)}
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
              <TableRow className="bg-[#16305f] text-white hover:bg-[#16305f]">
                <TableCell
                  colSpan={(showClient ? 2 : 0) + (showStock ? 1 : 0)}
                  style={boardCellPy}
                  className="px-3 font-bold"
                >
                  {t("ordersBoard.executions.grandTotal")}
                </TableCell>
                <TableCell style={boardCellPy} className="px-3 text-end font-data font-bold">
                  {formatQar(data?.totals.totalValue)}
                </TableCell>
                <TableCell />
                <TableCell style={boardCellPy} className="px-3 text-end font-data font-bold text-[#ffb4ac]">
                  {formatQar(data?.totals.sellValue)}
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell style={boardCellPy} className="px-3 text-end font-data font-bold text-[#9be3bd]">
                  {formatQar(data?.totals.buyValue)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </BoardSection>
  );
}
