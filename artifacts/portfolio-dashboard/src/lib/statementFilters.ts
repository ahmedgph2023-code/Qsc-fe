import { todayQatarIso } from "@/lib/qatarDates";

export type StatementKind = "portfolio" | "account" | "realized_summary" | "realized_details";

export type AccountLayout = "grouped" | "detailed";

const KINDS: StatementKind[] = ["portfolio", "account", "realized_summary", "realized_details"];

export function parseStatementKind(raw: string | null): StatementKind {
  return KINDS.includes(raw as StatementKind) ? (raw as StatementKind) : "portfolio";
}

export function parseAccountLayout(raw: string | null): AccountLayout {
  return raw === "detailed" ? "detailed" : "grouped";
}

export type StatementFilters = {
  clientId: string;
  kind: StatementKind;
  asOf: string;
  from: string;
  to: string;
  /** Account statement layout — default grouped. */
  accountLayout: AccountLayout;
  /** Realized-details ticker filter — empty = all. */
  ticker: string;
  /** Portfolio: include zero-quantity holdings — default false. */
  includeZeroQty: boolean;
};

function parseIncludeZeroQty(raw: string | null): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function parseStatementFilters(search: string): StatementFilters {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const today = todayQatarIso();
  const kind = parseStatementKind(q.get("kind"));
  const from = q.get("from") || today;
  let to = q.get("to") || today;
  // Period reports cannot go past today (picker max); clamp stale URLs that used tomorrow.
  if (to > today) to = today;
  const accountLayout = parseAccountLayout(q.get("layout"));
  const ticker = (q.get("ticker") || "").trim();
  const includeZeroQty = parseIncludeZeroQty(q.get("includeZeroQty"));

  if (from > to) {
    return {
      clientId: q.get("client") || "",
      kind,
      asOf: q.get("asOf") || today,
      from: to,
      to,
      accountLayout,
      ticker,
      includeZeroQty,
    };
  }

  return {
    clientId: q.get("client") || "",
    kind,
    asOf: q.get("asOf") || today,
    from,
    to,
    accountLayout,
    ticker,
    includeZeroQty,
  };
}

export function statementFiltersPath(filters: StatementFilters): string {
  const q = new URLSearchParams();
  if (filters.clientId) q.set("client", filters.clientId);
  q.set("kind", filters.kind);
  if (filters.kind === "portfolio") {
    q.set("asOf", filters.asOf);
    if (filters.includeZeroQty) q.set("includeZeroQty", "1");
  } else {
    q.set("from", filters.from);
    q.set("to", filters.to);
    if (filters.kind === "account") {
      q.set("layout", filters.accountLayout || "grouped");
    }
    if (filters.kind === "realized_details" && filters.ticker) {
      q.set("ticker", filters.ticker);
    }
  }
  return `/statements?${q.toString()}`;
}

export function statementRangeValid(filters: StatementFilters): boolean {
  if (filters.kind === "portfolio") return !!filters.asOf;
  // Same-day ranges are valid (from === to).
  return !!filters.from && !!filters.to && filters.from <= filters.to;
}

export function statementCanLoad(filters: StatementFilters): boolean {
  return !!filters.clientId && statementRangeValid(filters);
}

export function withStatementKind(filters: StatementFilters, kind: StatementKind): StatementFilters {
  const today = todayQatarIso();
  if (kind === "portfolio") {
    return {
      ...filters,
      kind,
      asOf: filters.asOf || today,
      ticker: "",
    };
  }
  return {
    ...filters,
    kind,
    from: filters.from || today,
    to: filters.to || today,
    // Keep ticker only when staying on / switching to realized details.
    ticker: kind === "realized_details" ? filters.ticker : "",
  };
}

export function ensureStatementSearchDefaults(search: string): string | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const kind = parseStatementKind(q.get("kind"));
  const today = todayQatarIso();
  let changed = false;

  if (kind === "portfolio") {
    if (!q.get("asOf")) {
      q.set("asOf", today);
      changed = true;
    }
  } else {
    if (!q.get("from")) {
      q.set("from", today);
      changed = true;
    }
    if (!q.get("to")) {
      q.set("to", today);
      changed = true;
    }
    if (kind === "account" && !q.get("layout")) {
      q.set("layout", "grouped");
      changed = true;
    }
  }

  return changed ? q.toString() : null;
}

/** Legacy year-start default — kept for explicit URL overrides only. */
export function yearStartIso(): string {
  return `${todayQatarIso().slice(0, 4)}-01-01`;
}
