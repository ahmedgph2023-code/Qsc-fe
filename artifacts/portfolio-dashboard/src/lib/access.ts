import { isSuperAdmin } from "@/lib/superAdmin";

export type AppRole = "admin" | "pm" | "approver" | "compliance" | "viewer";

export type NavAccess = {
  /** If true, only SUPER_ADMIN_USERNAME may see this item/route. */
  superAdminOnly?: boolean;
  /** Roles allowed. `admin` role always allowed unless superAdminOnly. Empty = all authenticated staff roles. */
  roles?: AppRole[];
};

export type NavItemDef = {
  href: string;
  label: string;
  access?: NavAccess;
};

/**
 * Phase 1 vision (Blueprint §20) stays open: dashboard, clients, stock master,
 * indices, builder, rebalances, sheet import, compliance, risk, audit, admin.
 * Later-phase surfaces stay locked (RoleGate). They are not listed in the sidebar.
 */
export const LOCKED_NAV_HREFS = new Set<string>([
  "/markets",
  "/screener",
  "/fixed-income",
  "/sectors",
  "/research/approved-list",
  "/research/sharia-esg",
  "/research/strategies",
  "/research/scoring",
  "/research/companies",
  "/simulator",
  "/orders",
  "/ai",
  "/commentary",
  "/scenarios",
  "/frontier",
  "/fees",
  "/ops-forms",
  "/reconciliation",
  "/reports",
]);

/** Canonical route access (nav + RoleRoute). Keep in sync with Shell groups. */
export const ROUTE_ACCESS: Record<string, NavAccess> = {
  "/": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/customers": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/customers-old": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/markets": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/screener": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/stocks": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/fixed-income": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/indices": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/sectors": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/research/approved-list": { roles: ["admin", "pm", "approver", "compliance"] },
  "/research/sharia-esg": { roles: ["admin", "pm", "approver", "compliance"] },
  "/research/strategies": { roles: ["admin", "pm", "approver", "compliance"] },
  "/research/scoring": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/research/companies": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/builder": { roles: ["admin", "pm", "approver"] },
  "/rebalances": { roles: ["admin", "pm", "approver", "compliance"] },
  "/simulator": { roles: ["admin", "pm", "approver"] },
  "/orders": { roles: ["admin", "pm", "approver", "compliance"] },
  "/ai": { roles: ["admin", "pm", "approver"] },
  "/commentary": { roles: ["admin", "pm", "approver"] },
  "/scenarios": { roles: ["admin", "pm", "approver"] },
  "/frontier": { roles: ["admin", "pm", "approver"] },
  "/fees": { roles: ["admin", "pm", "approver", "compliance"] },
  "/ops-forms": { roles: ["admin", "pm", "approver", "compliance"] },
  "/reconciliation": { roles: ["admin", "pm", "approver", "compliance"] },
  "/reports": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/statements": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/balances": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/live": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/workshop": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/uat": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/compliance": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/risk": { roles: ["admin", "pm", "approver", "compliance", "viewer"] },
  "/audit": { roles: ["admin"] },
  "/data-import": { superAdminOnly: true },
  "/system-config": { superAdminOnly: true },
  "/users": { roles: ["admin"] },
};

function normalizeRole(role?: string | null): AppRole {
  const r = (role || "viewer").toLowerCase();
  if (r === "admin" || r === "pm" || r === "approver" || r === "compliance" || r === "viewer") {
    return r;
  }
  return "viewer";
}

function matchPath(pathname: string): string | null {
  const path = pathname.split("?")[0] || "/";
  if (ROUTE_ACCESS[path]) return path;
  // Prefix matches for detail routes
  const prefixes = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length);
  for (const key of prefixes) {
    if (key !== "/" && path.startsWith(key + "/")) return key;
    if (key !== "/" && path.startsWith(key)) return key;
  }
  if (path.startsWith("/customers-old")) return "/customers-old";
  if (path.startsWith("/customers-2")) return "/customers";
  if (path.startsWith("/customers/")) return "/customers";
  if (path.startsWith("/stocks/")) return "/stocks";
  if (path.startsWith("/sectors/")) return "/sectors";
  if (path.startsWith("/indices/")) return "/indices";
  if (path.startsWith("/fixed-income/")) return "/fixed-income";
  if (path.startsWith("/rebalances/")) return "/rebalances";
  if (path.startsWith("/research/companies/")) return "/research/companies";
  return null;
}

export function isNavLocked(pathname: string): boolean {
  const path = pathname.split("?")[0] || "/";
  if (LOCKED_NAV_HREFS.has(path)) return true;
  const key = matchPath(path);
  return key != null && LOCKED_NAV_HREFS.has(key);
}

export function canAccessPath(
  pathname: string,
  opts: { role?: string | null; username?: string | null },
): boolean {
  if (isNavLocked(pathname)) return false;
  if (isSuperAdmin(opts.username)) return true;

  const key = matchPath(pathname);
  if (!key) {
    // Unknown page: allow admin only; others go home via RoleRoute
    return normalizeRole(opts.role) === "admin";
  }

  const access = ROUTE_ACCESS[key] ?? { roles: ["admin", "pm", "approver", "compliance", "viewer"] };
  if (access.superAdminOnly) return false;

  const role = normalizeRole(opts.role);
  if (role === "admin") return true;
  const allowed = access.roles ?? ["admin", "pm", "approver", "compliance", "viewer"];
  return allowed.includes(role);
}

export function canAccessNavItem(
  href: string,
  access: NavAccess | undefined,
  opts: { role?: string | null; username?: string | null },
): boolean {
  if (access?.superAdminOnly) return isSuperAdmin(opts.username);
  if (isSuperAdmin(opts.username)) return true;

  const role = normalizeRole(opts.role);
  if (role === "admin") return !access?.superAdminOnly;

  const fromMap = ROUTE_ACCESS[href];
  const effective = access ?? fromMap ?? { roles: ["admin", "pm", "approver", "compliance", "viewer"] };
  if (effective.superAdminOnly) return false;
  const allowed = effective.roles ?? ["admin", "pm", "approver", "compliance", "viewer"];
  return allowed.includes(role);
}

export function firstAllowedHome(opts: { role?: string | null; username?: string | null }): string {
  const candidates = ["/", "/customers", "/stocks", "/compliance", "/users"];
  for (const href of candidates) {
    if (canAccessPath(href, opts)) return href;
  }
  return "/";
}

/** Action-level permissions (SEC-04). Admin always allowed unless superAdminOnly action. */
export type AppAction =
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "trade.mutate"
  | "cash.mutate"
  | "builder.mutate"
  | "builder.convert"
  | "mandate.draft"
  | "mandate.approve"
  | "compliance.run"
  | "compliance.exception"
  | "risk.scan"
  | "risk.resolve"
  | "risk.waive"
  | "stock.mutate"
  | "stock.delete"
  | "rebalance.approve"
  | "rebalance.execute"
  | "fee.generate"
  | "fee.approve"
  | "order.mutate"
  | "order.approve"
  | "sim.run"
  | "snapshot.run";

const ACTION_ROLES: Record<AppAction, AppRole[]> = {
  "customer.create": ["admin", "pm"],
  "customer.update": ["admin", "pm"],
  "customer.delete": ["admin"],
  "trade.mutate": ["admin", "pm"],
  "cash.mutate": ["admin", "pm"],
  "builder.mutate": ["admin", "pm"],
  "builder.convert": ["admin", "pm"],
  "mandate.draft": ["admin", "pm"],
  "mandate.approve": ["admin", "approver"],
  "compliance.run": ["admin", "pm", "approver", "compliance"],
  "compliance.exception": ["admin", "pm", "approver"],
  "risk.scan": ["admin", "pm", "approver", "compliance"],
  "risk.resolve": ["admin", "pm", "approver"],
  "risk.waive": ["admin", "approver"],
  "stock.mutate": ["admin", "pm"],
  "stock.delete": ["admin"],
  "rebalance.approve": ["admin", "approver"],
  "rebalance.execute": ["admin", "pm"],
  "fee.generate": ["admin", "pm"],
  "fee.approve": ["admin", "approver"],
  "order.mutate": ["admin", "pm"],
  "order.approve": ["admin", "pm", "approver"],
  "sim.run": ["admin", "pm", "approver"],
  "snapshot.run": ["admin", "pm", "approver", "compliance"],
};

export function canPerformAction(
  action: AppAction,
  opts: { role?: string | null; username?: string | null },
): boolean {
  if (isSuperAdmin(opts.username)) return true;
  const role = normalizeRole(opts.role);
  if (role === "admin") return true;
  return (ACTION_ROLES[action] ?? []).includes(role);
}
