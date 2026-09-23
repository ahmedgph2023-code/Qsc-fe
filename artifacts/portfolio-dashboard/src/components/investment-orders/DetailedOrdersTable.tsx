import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Inbox, X } from "lucide-react";
import { EmptyState } from "@/components/phase1/PageHeader";
import { SelectField } from "@/components/phase1/SelectField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { CompanyTickerIcon } from "@/components/phase1/CompanyTickerIcon";
import { formatQty, formatStatementAmount } from "@/components/statements/StatementPreview";
import { getInvestmentClientOrders, type InvestmentOrderRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { BoardBadge, BoardSection, OutlinePill, SidePill, boardCellPy, boardTh } from "./OrdersBoardChrome";

const POLL_MS = 15_000;
const FILTER_CLASS = "h-9 w-auto min-w-[8rem] max-w-[12rem]";

export type OrdersFilterState = {
  orderType: "all" | "buy" | "sell";
  ticker: string;
  status: string;
  validity: string;
  orderNo: string;
  clientId: string;
  q: string;
};

/**
 * Typed filters update the URL — and therefore the query — only once the user
 * pauses, so a name search is one request instead of one per keystroke.
 */
function useDebouncedText(value: string, commit: (next: string) => void) {
  const [draft, setDraft] = useState(value);
  const committed = useRef(value);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    if (draft === committed.current) return;
    const id = window.setTimeout(() => {
      committed.current = draft;
      commit(draft);
    }, 350);
    return () => window.clearTimeout(id);
  }, [draft, commit]);

  return [draft, setDraft] as const;
}

/** Price on an order comes from value ÷ quantity when SQL has no price column. */
function orderPrice(row: InvestmentOrderRow): number | null {
  if (row.orderValue != null && row.totalQty) return row.orderValue / row.totalQty;
  return null;
}

function validityPill(row: InvestmentOrderRow, gtcLabel: string, dayLabel: string) {
  if (row.validity.kind === "Daily") return <OutlinePill tone="day">{dayLabel}</OutlinePill>;
  return <OutlinePill tone="gtc">{row.validity.until || gtcLabel}</OutlinePill>;
}

export function DetailedOrdersTable({
  filters,
  onFiltersChange,
  onClear,
}: {
  filters: OrdersFilterState;
  onFiltersChange: (next: Partial<OrdersFilterState>) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  const [orderNo, setOrderNo] = useDebouncedText(
    filters.orderNo,
    useCallback((next: string) => onFiltersChange({ orderNo: next }), [onFiltersChange]),
  );
  const [clientId, setClientId] = useDebouncedText(
    filters.clientId,
    useCallback((next: string) => onFiltersChange({ clientId: next }), [onFiltersChange]),
  );
  const [query, setQuery] = useDebouncedText(
    filters.q,
    useCallback((next: string) => onFiltersChange({ q: next }), [onFiltersChange]),
  );

  const { data, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["investment-orders", filters],
    queryFn: () => getInvestmentClientOrders(filters),
    refetchInterval: POLL_MS,
  });

  const rows = data?.rows ?? [];
  const paging = useClientTablePage(rows, `${JSON.stringify(filters)}|${rows.length}|${dataUpdatedAt}`);

  const tickerOptions = useMemo(
    () => [
      { value: "", label: t("ordersBoard.filters.allStocks"), search: "all" },
      ...(data?.options.tickers ?? []).map((ticker) => ({ value: ticker, label: ticker, search: ticker })),
    ],
    [data?.options.tickers, t],
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("ordersBoard.filters.allStatuses"), search: "all" },
      ...(data?.options.statuses ?? []).map((s) => ({
        value: s.code,
        label: s.label,
        search: `${s.code} ${s.label}`,
      })),
    ],
    [data?.options.statuses, t],
  );

  const validityOptions = useMemo(
    () => [
      { value: "", label: t("ordersBoard.filters.allValidities"), search: "all" },
      ...(data?.options.validities ?? []).map((v) => ({
        value: v,
        label: v === "Daily" ? t("investmentOrders.validityDaily") : t("ordersBoard.filters.datedValidity"),
        search: v,
      })),
    ],
    [data?.options.validities, t],
  );

  const sideTabs: Array<OrdersFilterState["orderType"]> = ["all", "buy", "sell"];

  return (
    <BoardSection
      title={t("ordersBoard.detailed.title")}
      subtitle={t("ordersBoard.detailed.subtitle")}
      end={
        <BoardBadge>
          {t("ordersBoard.detailed.count", { filtered: data?.filtered ?? 0, total: data?.total ?? 0 })}
        </BoardBadge>
      }
    >
      <div className="flex flex-wrap items-end gap-3 border-b border-[#e6ecf6] bg-[#fbfcff] px-4 py-3">
        <FilterField label={t("ordersBoard.filters.type")}>
          <div className="flex overflow-hidden rounded-md border border-[#d7e0ee]">
            {sideTabs.map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onFiltersChange({ orderType: side })}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold transition",
                  filters.orderType === side ? "bg-[#16305f] text-white" : "bg-white text-[#42506b] hover:bg-[#f2f6fd]",
                )}
              >
                {t(`ordersBoard.filters.side.${side}`)}
              </button>
            ))}
          </div>
        </FilterField>

        <FilterField label={t("ordersBoard.filters.symbol")}>
          <SelectField
            className={FILTER_CLASS}
            value={filters.ticker}
            onValueChange={(ticker) => onFiltersChange({ ticker })}
            options={tickerOptions}
            placeholder={t("ordersBoard.filters.allStocks")}
          />
        </FilterField>

        <FilterField label={t("ordersBoard.filters.status")}>
          <SelectField
            className={FILTER_CLASS}
            value={filters.status}
            onValueChange={(status) => onFiltersChange({ status })}
            options={statusOptions}
            placeholder={t("ordersBoard.filters.allStatuses")}
          />
        </FilterField>

        <FilterField label={t("ordersBoard.filters.validity")}>
          <SelectField
            className={FILTER_CLASS}
            value={filters.validity}
            onValueChange={(validity) => onFiltersChange({ validity })}
            options={validityOptions}
            placeholder={t("ordersBoard.filters.allValidities")}
          />
        </FilterField>

        <FilterField label={t("ordersBoard.filters.orderNo")}>
          <Input
            className="h-9 w-36"
            value={orderNo}
            placeholder={t("ordersBoard.filters.orderNoPlaceholder")}
            onChange={(e) => setOrderNo(e.target.value)}
          />
        </FilterField>

        <FilterField label={t("ordersBoard.filters.client")}>
          <Input
            className="h-9 w-40"
            value={clientId}
            inputMode="numeric"
            placeholder={t("ordersBoard.filters.clientPlaceholder")}
            onChange={(e) => setClientId(e.target.value.replace(/\D/g, ""))}
          />
        </FilterField>

        <FilterField label={t("ordersBoard.filters.search")}>
          <Input
            className="h-9 w-44"
            value={query}
            placeholder={t("ordersBoard.filters.searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </FilterField>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#f3c0bd] text-[#b42318] hover:bg-[#fdefee]"
          onClick={onClear}
        >
          <X className="me-1 h-3.5 w-3.5" />
          {t("ordersBoard.filters.clear")}
        </Button>
      </div>

      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <EmptyState
          className="py-12"
          icon={<AlertTriangle className="h-10 w-10" />}
          title={t("investmentOrders.errorTitle")}
          description={(error as Error | undefined)?.message || t("investmentOrders.errorDesc")}
        />
      ) : data && !data.tableFound ? (
        <EmptyState
          className="py-12"
          icon={<AlertTriangle className="h-10 w-10" />}
          title={t("investmentOrders.tableMissingTitle")}
          description={data.warning || t("investmentOrders.tableMissingDesc")}
        />
      ) : !rows.length ? (
        <EmptyState
          className="py-12"
          icon={<Inbox className="h-10 w-10" />}
          title={t("investmentOrders.emptyTitle")}
          description={t("investmentOrders.emptyDesc")}
        />
      ) : (
        <>
          <div className="clients-table-wrap overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={boardTh}>{t("ordersBoard.col.logo")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.symbol")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.side")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.price")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.qty")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.exeQty")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.remain")}</TableHead>
                  <TableHead className={cn(boardTh, "text-end")}>{t("ordersBoard.col.visible")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.validity")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.status")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.orderNo")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.nin")}</TableHead>
                  <TableHead className={boardTh}>{t("ordersBoard.col.clientName")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paging.paged.map((row) => (
                  <TableRow key={`${row.orderNumber}-${row.ticker}-${row.statusCode}`} className="hover:bg-[#f4f7fd]">
                    <TableCell style={boardCellPy} className="px-3">
                      <CompanyTickerIcon ticker={row.ticker} companyName={row.companyName ?? undefined} />
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 font-mono font-bold text-[#16305f]">
                      {row.ticker}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3">
                      <SidePill
                        side={row.orderType}
                        buyLabel={t("ordersBoard.side.buy")}
                        sellLabel={t("ordersBoard.side.sell")}
                      />
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data">
                      {formatStatementAmount(orderPrice(row))}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data">
                      {formatQty(row.totalQty)}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data">
                      {formatQty(row.executedQty)}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data font-semibold">
                      {formatQty(row.remainingQty ?? Math.max(0, (row.totalQty ?? 0) - (row.executedQty ?? 0)))}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 text-end font-data">
                      {formatQty(row.displayedQty)}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3">
                      {validityPill(row, t("ordersBoard.filters.datedValidity"), t("investmentOrders.validityDaily"))}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3">
                      <OutlinePill tone="status">{row.statusLabel}</OutlinePill>
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3 font-data">{row.orderNumber}</TableCell>
                    <TableCell style={boardCellPy} className="px-3 font-data text-[#657491]">
                      {row.nin || "—"}
                    </TableCell>
                    <TableCell style={boardCellPy} className="px-3">{row.clientName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ClientTableFooter paging={paging} />
        </>
      )}
    </BoardSection>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-[#657491]">{label}</span>
      {children}
    </label>
  );
}
