import { todayQatarIso } from "@/lib/qatarDates";
import type { SnapshotMatchStatus } from "@/lib/api";

const STATUSES: SnapshotMatchStatus[] = [
  "matched",
  "cash_only",
  "mismatch",
  "incomplete",
  "qsc_missing",
];

export type BalanceFilters = {
  asOf: string;
  status: SnapshotMatchStatus | "";
  clientId: string;
};

function parseStatus(raw: string | null): BalanceFilters["status"] {
  return STATUSES.includes(raw as SnapshotMatchStatus) ? (raw as SnapshotMatchStatus) : "";
}

export function parseBalanceFilters(search: string): BalanceFilters {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    asOf: q.get("asOf") || todayQatarIso(),
    status: parseStatus(q.get("status")),
    clientId: q.get("client") || "",
  };
}

export function balanceFiltersPath(filters: BalanceFilters): string {
  const q = new URLSearchParams();
  q.set("asOf", filters.asOf);
  if (filters.status) q.set("status", filters.status);
  if (filters.clientId) q.set("client", filters.clientId);
  return `/balances?${q.toString()}`;
}

export function ensureBalanceSearchDefaults(search: string): string | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (q.get("asOf")) return null;
  q.set("asOf", todayQatarIso());
  return q.toString();
}
