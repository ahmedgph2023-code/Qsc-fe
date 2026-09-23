import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearch } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { PageHeader } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DailyExecutionsPanel } from "@/components/investment-orders/DailyExecutionsPanel";
import { AvailableBalancesPanel } from "@/components/investment-orders/AvailableBalancesPanel";
import { PendingOrdersPanel } from "@/components/investment-orders/PendingOrdersPanel";
import {
  DetailedOrdersTable,
  type OrdersFilterState,
} from "@/components/investment-orders/DetailedOrdersTable";
import { todayQatarIso } from "@/lib/qatarDates";
import type { ExecutionsView } from "@/lib/api";

type BoardState = OrdersFilterState & { asOf: string; view: ExecutionsView };

const EMPTY_FILTERS: OrdersFilterState = {
  orderType: "all",
  ticker: "",
  status: "",
  validity: "",
  orderNo: "",
  clientId: "",
  q: "",
};

function parseState(search: string): BoardState {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const view = p.get("view");
  const orderType = (p.get("orderType") || "all").toLowerCase();
  return {
    asOf: p.get("asOf") || todayQatarIso(),
    view: view === "stock" || view === "client" ? view : "client_stock",
    orderType: orderType === "buy" || orderType === "sell" ? orderType : "all",
    ticker: (p.get("ticker") || "").trim().toUpperCase(),
    status: (p.get("status") || "").trim().toUpperCase(),
    validity: p.get("validity") || "",
    orderNo: p.get("orderNo") || "",
    clientId: (p.get("clientId") || "").replace(/\D/g, ""),
    q: p.get("q") || "",
  };
}

function statePath(state: BoardState): string {
  const p = new URLSearchParams();
  if (state.asOf !== todayQatarIso()) p.set("asOf", state.asOf);
  if (state.view !== "client_stock") p.set("view", state.view);
  if (state.orderType !== "all") p.set("orderType", state.orderType);
  for (const key of ["ticker", "status", "validity", "orderNo", "clientId", "q"] as const) {
    if (state[key]) p.set(key, state[key]);
  }
  const qs = p.toString();
  return qs ? `/investment-orders?${qs}` : "/investment-orders";
}

/**
 * The Investment Manager board: the day's executions on top, cash and the live
 * order book beside each other, and the full order list below. Clicking a
 * client or a stock in any panel filters the list, so the whole screen shares
 * one filter state held in the URL.
 */
export default function InvestmentOrders() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const state = useMemo(() => parseState(search), [search]);

  // Filter changes replace the history entry so Back leaves the page instead of
  // stepping through every filter the manager tried.
  const update = useCallback(
    (next: Partial<BoardState>) => setLocation(statePath({ ...state, ...next }), { replace: true }),
    [state, setLocation],
  );
  const clearFilters = useCallback(() => update(EMPTY_FILTERS), [update]);

  return (
    <Shell>
      <PageHeader title={t("ordersBoard.title")} description={t("ordersBoard.description")} />

      <div className="space-y-4">
        <DailyExecutionsPanel
          asOf={state.asOf}
          view={state.view}
          onViewChange={(view) => update({ view })}
          onClientClick={(row) => update({ clientId: row.clientId == null ? "" : String(row.clientId) })}
          onTickerClick={(ticker) => update({ ticker: ticker.toUpperCase() })}
        />

        <div className="flex flex-wrap items-center gap-3">
          <DatePicker
            className="min-w-fit w-auto shrink-0"
            value={state.asOf}
            onChange={(asOf) => update({ asOf })}
            prefix={t("statements.asOf")}
            max={todayQatarIso()}
          />
          <span className="text-[11px] text-[#8a97ad]">{t("ordersBoard.asOfNote")}</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <AvailableBalancesPanel
            asOf={state.asOf}
            selectedClientId={state.clientId}
            onClientClick={(clientId) =>
              update({ clientId: state.clientId === String(clientId) ? "" : String(clientId) })
            }
          />
          <div className="lg:col-span-2">
            <PendingOrdersPanel
              selectedTicker={state.ticker}
              onTickerClick={(ticker, side) =>
                update(
                  state.ticker === ticker.toUpperCase()
                    ? { ticker: "", orderType: "all" }
                    : { ticker: ticker.toUpperCase(), orderType: side === "Buy" ? "buy" : "sell" },
                )
              }
            />
          </div>
        </div>

        <DetailedOrdersTable filters={state} onFiltersChange={update} onClear={clearFilters} />
      </div>
    </Shell>
  );
}
