import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard, Users, LineChart, TrendingUp, LogOut, Menu,
  Blocks, RefreshCw, ShieldCheck, TriangleAlert,
  Search, FileText, UserCog, Scale, Radio, ClipboardList,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { getFeePendingCount } from "@/lib/api";
import { canAccessNavItem, isNavLocked, ROUTE_ACCESS, type NavAccess } from "@/lib/access";
import { useUiPrefs } from "@/lib/UiPrefsContext";
import { useLocale } from "@/i18n/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DisplaySettingsMenu } from "@/components/layout/DisplaySettingsMenu";
import { FullscreenToggle } from "@/components/layout/FullscreenToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NavItemHelp } from "@/components/layout/NavItemHelp";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import {
  SHELL_ACTION_ICON,
  SHELL_CIRCLE,
} from "@/components/layout/shellChrome";

const NAV_GROUPS: Array<{
  labelKey: string;
  items: Array<{ href: string; labelKey: string; icon: LucideIcon; access?: NavAccess }>;
}> = [
  { labelKey: "nav.groups.overview", items: [
    { href: "/", labelKey: "nav.items.dashboard", icon: LayoutDashboard },
    { href: "/customers", labelKey: "nav.items.clients", icon: Users },
  ]},
  { labelKey: "nav.groups.markets", items: [
    { href: "/stocks", labelKey: "nav.items.stocks", icon: LineChart },
    { href: "/indices", labelKey: "nav.items.indices", icon: TrendingUp },
  ]},
  { labelKey: "nav.groups.construction", items: [
    { href: "/builder", labelKey: "nav.items.builder", icon: Blocks },
    { href: "/rebalances", labelKey: "nav.items.rebalances", icon: RefreshCw },
  ]},
  { labelKey: "nav.groups.control", items: [
    { href: "/statements", labelKey: "nav.items.statements", icon: FileText },
    { href: "/balances", labelKey: "nav.items.balances", icon: Scale },
    { href: "/live", labelKey: "nav.items.live", icon: Radio },
    { href: "/workshop", labelKey: "nav.items.workshop", icon: ClipboardList },
    { href: "/compliance", labelKey: "nav.items.compliance", icon: ShieldCheck },
    { href: "/risk", labelKey: "nav.items.risk", icon: TriangleAlert },
  ]},
  { labelKey: "nav.groups.admin", items: [
    { href: "/users", labelKey: "nav.items.users", icon: UserCog, access: { roles: ["admin"] } },
  ]},
];

function navGroupsFor(username?: string | null, role?: string | null) {
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        !isNavLocked(item.href) &&
        canAccessNavItem(item.href, item.access ?? ROUTE_ACCESS[item.href], { username, role }),
      ),
    }))
    .filter((group) => group.items.length > 0);
}

function navFlatFor(username?: string | null, role?: string | null) {
  return navGroupsFor(username, role).flatMap((g) =>
    g.items.map((item) => ({ ...item, groupKey: g.labelKey })),
  );
}

const COLLAPSE_KEY = "qsc-shell-collapsed";
const SIDEBAR_EXPANDED_W = 260;
const SIDEBAR_COLLAPSED_W = 72;

const AVATAR_FACE = [
  "relative grid shrink-0 place-items-center rounded-full font-bold text-white",
  "bg-[linear-gradient(145deg,color-mix(in_srgb,var(--shell-blue)_42%,var(--shell-mix-base))_0%,var(--shell-blue)_55%)]",
  "border border-(--shell-border)",
  "shadow-[0_6px_14px_color-mix(in_srgb,var(--shell-blue)_22%,transparent),inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_5px_color-mix(in_srgb,var(--shell-blue)_32%,transparent)]",
].join(" ");

function initials(name?: string | null, fallback?: string | null) {
  const source = (name || fallback || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className="hidden whitespace-nowrap font-[family-name:var(--app-font-mono)] text-[11px] text-(--shell-muted) min-[901px]:inline"
      title="Asia/Qatar"
    >
      {now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Qatar" })} AST
    </span>
  );
}

function useCompactNavRail() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return compact;
}

function CollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[17px] rtl:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      {collapsed ? <path d="m10 8 4 4-4 4" /> : <path d="m14 8-4 4 4 4" />}
    </svg>
  );
}

function SidebarCollapseButton({
  collapsed,
  onToggle,
  className,
  expandLabel,
  collapseLabel,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const label = collapsed ? expandLabel : collapseLabel;
  return (
    <button
      type="button"
      className={cn("shell-collapse-btn grid size-8 place-items-center rounded-full", className)}
      onClick={onToggle}
      aria-label={label}
      title={label}
      aria-pressed={collapsed}
    >
      <CollapseGlyph collapsed={collapsed} />
    </button>
  );
}

function SidebarNavItem({
  href,
  labelKey,
  icon: Icon,
  isActive,
  iconOnly,
  badge,
  locked,
  onNavigate,
}: {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  isActive: boolean;
  iconOnly: boolean;
  badge?: number;
  locked?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { dir } = useLocale();
  const label = t(labelKey);
  const lockedTitle = locked ? `${label} — ${t("nav.lockedHint")}` : label;
  const linkClass = cn(
    "relative flex w-full min-w-0 flex-1 items-center no-underline transition-[background,color,box-shadow,border-color] duration-200",
    !locked && "shell-nav-link",
    !locked && isActive && "is-active",
    iconOnly
      ? "h-[43px] justify-center gap-0 rounded-[11px] px-0"
      : "my-0.5 h-10 gap-3.5 rounded-[11px] px-[11px]",
    "text-[14px] leading-none",
    locked
      ? "cursor-not-allowed font-medium text-[#142b55] opacity-40 dark:text-(--shell-nav-ink)"
      : isActive
        ? "font-bold text-(--shell-blue)"
        : "font-medium text-[#142b55] dark:text-(--shell-nav-ink)",
  );
  const inner = (
    <>
      {isActive && !locked ? (
        <span
          aria-hidden
          className={cn(
            "absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-[4px] bg-(--shell-blue)",
            !iconOnly && "start-[-1px]",
          )}
        />
      ) : null}
      <span
        className={cn(
          "relative grid shrink-0 place-items-center",
          iconOnly ? "size-[22px]" : "size-5",
          locked || !isActive
            ? "text-[#60779f] dark:text-(--shell-nav-muted)"
            : "text-(--shell-blue)",
        )}
        aria-hidden
      >
        <Icon className="size-[17px]" strokeWidth={1.55} />
        {badge != null && badge > 0 && iconOnly && !locked ? (
          <span className="absolute -end-1 -top-1 grid h-3 min-w-3 place-items-center rounded-full bg-(--shell-blue) px-0.5 text-[8px] font-extrabold leading-3 text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "min-w-0 flex-1 overflow-hidden whitespace-nowrap",
          iconOnly ? "hidden" : "block",
        )}
        aria-hidden={iconOnly}
      >
        {label}
      </span>
      {badge != null && badge > 0 && !iconOnly && !locked ? (
        <span className="ms-auto shrink-0 rounded-md bg-(--shell-blue) px-1.5 py-0.5 text-[10px] font-extrabold text-white">
          {badge}
        </span>
      ) : null}
    </>
  );

  const control = locked ? (
    <span
      className={linkClass}
      aria-disabled="true"
      aria-label={iconOnly ? t("nav.lockedAria", { page: label }) : undefined}
      title={iconOnly ? undefined : lockedTitle}
    >
      {inner}
    </span>
  ) : (
    <Link
      href={href}
      onClick={onNavigate}
      className={linkClass}
      aria-current={isActive ? "page" : undefined}
      aria-label={iconOnly ? label : undefined}
    >
      {inner}
    </Link>
  );

  const tipped =
    iconOnly ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex min-w-0 flex-1">{control}</span>
        </TooltipTrigger>
        <TooltipContent
          side={dir === "rtl" ? "left" : "right"}
          sideOffset={12}
          className="rounded-[7px] border-0 bg-[#142a51] px-2.5 py-[7px] text-[12px] text-white shadow-none"
        >
          {locked ? lockedTitle : label}
        </TooltipContent>
      </Tooltip>
    ) : (
      control
    );

  return (
    <div className="group/nav relative w-full">
      {tipped}
      <NavItemHelp
        href={href}
        title={label}
        iconOnly={iconOnly}
        className={
          iconOnly
            ? "absolute -end-0.5 -top-0.5 z-10"
            : "absolute end-1.5 top-1/2 z-10 -translate-y-1/2"
        }
      />
    </div>
  );
}

function SidebarContent({
  location,
  username,
  role,
  displayName,
  onLogout,
  onNavigate,
  iconOnly = false,
  showCollapse = false,
  collapsed = false,
  onCollapse,
  embedded = false,
}: {
  location: string;
  username?: string | null;
  role?: string | null;
  displayName?: string | null;
  onLogout?: () => void;
  onNavigate?: () => void;
  iconOnly?: boolean;
  showCollapse?: boolean;
  collapsed?: boolean;
  onCollapse?: () => void;
  /** Flush into shell frame (no floating card chrome). */
  embedded?: boolean;
}) {
  const groups = navGroupsFor(username, role);
  const { t } = useTranslation();

  return (
    <div className="relative h-full overflow-visible">
      {showCollapse && onCollapse && !embedded ? (
        <SidebarCollapseButton
          collapsed={collapsed}
          onToggle={onCollapse}
          expandLabel={t("nav.expandSidebar")}
          collapseLabel={t("nav.collapseSidebar")}
          className={
            iconOnly
              ? "absolute end-0 top-[29px] z-40 -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2"
              : "absolute end-[5px] top-[5px] z-40 size-10 border-[3px]"
          }
        />
      ) : null}

      <div
        className={cn(
          "relative z-20 flex h-full flex-col overflow-hidden",
          embedded
            ? "rounded-none border-0 bg-transparent shadow-none dark:bg-transparent"
            : [
                "rounded-[20px] border border-[#dfe6f2] bg-[#f8faff]",
                "shadow-[0_14px_35px_rgba(28,55,100,0.09)]",
                "dark:border-(--shell-border) dark:bg-(image:--shell-chrome) dark:shadow-(--shell-chrome-elev)",
              ],
        )}
      >

      {!embedded ? (
      <div
        className={cn(
          "relative z-20 flex shrink-0 items-center border-b border-[#e0e7f2] dark:border-(--shell-line)",
          iconOnly ? "h-[58px] justify-center px-2" : cn("h-[58px] px-3.5", showCollapse && "pe-12"),
        )}
      >
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 items-center"
          aria-label="QSC"
        >
          {iconOnly ? (
            <BrandLogo variant="mark" className="h-8 w-8 object-contain" />
          ) : (
            <BrandLogo variant="wordmark" className="h-9 w-auto max-w-[168px] object-contain" />
          )}
        </Link>
      </div>
      ) : null}

      <nav
        className={cn(
          "app-sidebar-nav min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-0.5 pb-1.5 pt-1.5",
          iconOnly ? "px-1.5" : "ps-2.5 pe-1.5",
        )}
        aria-label={t("nav.primary")}
      >
        {groups.map((group, index) => (
          <div
            key={group.labelKey}
            className={cn(
              !iconOnly && "pe-1",
              index > 0 && !iconOnly && "mt-[7px] border-t border-[#dce5f2] pt-[7px] dark:border-(--shell-line)",
            )}
          >
            <p
              className={cn(
                "flex items-center font-bold text-[#61779d] dark:text-(--shell-nav-group)",
                iconOnly
                  ? cn(
                      "justify-center p-0 text-[0px]",
                      index > 0
                        ? "h-[13px] after:block after:h-px after:w-7 after:bg-[#d8e2f0] after:content-[''] dark:after:bg-(--shell-line)"
                        : "h-0 overflow-hidden",
                    )
                  : "h-[27px] px-[9px] text-[12px]",
              )}
              aria-hidden={iconOnly}
            >
              {t(group.labelKey)}
            </p>
            <div className="flex flex-col">
              {group.items.map((item) => {
                const locked = isNavLocked(item.href);
                const isActive = !locked && (item.href === "/"
                  ? location === "/"
                  : location === item.href || location.startsWith(`${item.href}/`));
                return (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    labelKey={item.labelKey}
                    icon={item.icon}
                    isActive={isActive}
                    iconOnly={iconOnly}
                    locked={locked}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {onLogout ? (
        <AccountMenu
          displayName={displayName}
          username={username}
          role={role}
          onLogout={onLogout}
          variant="sidebar"
          iconOnly={iconOnly}
        />
      ) : null}
      </div>
    </div>
  );
}

function MenuSearch({
  onPick,
  username,
  role,
}: {
  onPick: (href: string) => void;
  username?: string | null;
  role?: string | null;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const items = useMemo(() => navFlatFor(username, role), [username, role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      `${t(item.labelKey)} ${t(item.groupKey)}`.toLowerCase().includes(q),
    );
  }, [query, items, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="control relative flex w-min min-w-0 max-w-full flex-[0_1_280px] items-center gap-2 text-(--ui-control-muted) focus-within:shadow-(--ui-control-shadow-focus)">
      <Search className="size-[var(--ui-icon-size)] shrink-0" aria-hidden />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={t("nav.searchMenu")}
        aria-label={t("nav.searchMenuLabel")}
        className="h-full min-w-0 flex-1 border-0! bg-transparent p-0 text-[length:var(--ui-control-font-size)] font-[number:var(--ui-control-font-weight)] text-(--ui-control-ink) shadow-none! outline-none! focus:border-0! focus:shadow-none! focus:outline-none! focus-visible:border-0! focus-visible:shadow-none! focus-visible:outline-none! hover:border-0! hover:shadow-none! placeholder:text-(--ui-control-muted)"
      />
      <kbd className="ms-auto shrink-0 rounded-full bg-[#eef2fa] px-2 py-1 text-[10px] font-bold text-[#54658a]">
        {isMac ? "⌘" : "Ctrl"} K
      </kbd>
      {open && (
        <div
          className="absolute inset-x-0 top-[calc(100%+8px)] z-40 max-h-80 overflow-auto rounded-2xl border border-(--shell-border) bg-(image:--shell-surface) p-2 shadow-(--shell-shadow)"
          role="listbox"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-(--shell-muted)">{t("nav.noMatchingMenus")}</p>
          ) : results.map((item) => {
            const locked = isNavLocked(item.href);
            return (
            <button
              key={item.href}
              type="button"
              disabled={locked}
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-start text-[13px]",
                locked
                  ? "cursor-not-allowed text-(--shell-muted) opacity-40"
                  : "text-(--shell-ink) hover:bg-(--shell-nav-hover) hover:text-(--shell-blue)",
              )}
              title={locked ? t("nav.lockedHint") : undefined}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (locked) return;
                onPick(item.href);
                setQuery("");
                setOpen(false);
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{t(item.labelKey)}</span>
              <span className="ms-auto text-[11px] text-(--shell-muted)">
                {locked ? t("nav.lockedHint") : t(item.groupKey)}
              </span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
 
function AccountMenu({
  displayName,
  username,
  role,
  onLogout,
  variant = "header",
  iconOnly = false,
}: {
  displayName?: string | null;
  username?: string | null;
  role?: string | null;
  onLogout: () => void;
  variant?: "header" | "sidebar";
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const roleLabel = role
    ? t(`nav.roleLabels.${role}`, { defaultValue: role })
    : t("nav.roleLabels.user", { defaultValue: "user" });

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "flex min-h-[58px] w-full shrink-0 items-center border-t border-[#e0e7f2] bg-white",
          "dark:border-(--shell-border) dark:bg-(image:--shell-surface)",
          iconOnly ? "justify-center gap-0 px-1 py-2" : "gap-2.5 px-2.5 py-2",
        )}
      >
        <span className={cn(AVATAR_FACE, "size-[37px] text-[13px]")}>
          {initials(displayName, username)}
          <span
            aria-hidden
            className="absolute -end-px bottom-0 size-[9px] rounded-full border-2 border-white bg-[#22c98a]"
          />
        </span>
        <span className={cn("min-w-0 flex-1 text-start", iconOnly && "hidden")}>
          <b className="block truncate text-[12px] font-bold text-[#12284f] dark:text-(--shell-ink)">
            {displayName || username}
          </b>
          <span className="mt-0.5 block truncate text-[11px] text-[#7183a1] dark:text-(--shell-muted)">
            {roleLabel}
          </span>
        </span>
        <button
          type="button"
          onClick={onLogout}
          aria-label={t("nav.logout")}
          title={t("nav.logout")}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full text-[#5b7094]",
            "hover:bg-[#f0f4fb] hover:text-[#c23d3d]",
            iconOnly && "sr-only",
          )}
        >
          <LogOut className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.accountMenu")}
          data-state={open ? "open" : "closed"}
          className={cn(
            "group flex h-[52px] min-w-0 items-center gap-2 rounded-full",
            "[border:var(--ui-control-border)]",
            "bg-(image:--ui-control-bg)",
            "py-1 pe-2 ps-1",
            "shadow-(--ui-control-shadow)",
            "transition-[transform,box-shadow,background,color] duration-200",
            "hover:-translate-y-px hover:bg-(image:--ui-control-bg-hover)",
            open && "text-(--shell-blue) shadow-(--ui-control-shadow-focus)",
          )}
        >
          <span className={cn(AVATAR_FACE, "size-[40px] text-[12px]")}>
            {initials(displayName, username)}
          </span>

          <span className="hidden min-[1101px]:block min-w-0 text-start">
            <b className="block max-w-[125px] truncate text-[12px] font-semibold tracking-[-0.01em] text-(--shell-ink)">
              {displayName || username}
            </b>
          </span>

          <span
            className={cn(
              "grid size-[28px] shrink-0 place-items-center rounded-full",
              "[border:var(--ui-control-border)]",
              "bg-(image:--ui-control-bg)",
              "shadow-(--ui-control-shadow)",
            )}
          >
            <ChevronRight
              className={cn(
                "h-[13px] w-[13px] text-(--shell-blue)",
                "transition-transform duration-200",
                open ? "-rotate-90" : "rotate-90",
              )}
            />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[270px] overflow-visible border-0! bg-transparent! p-0 shadow-none!"
      >
        <div className="shell-account-panel relative overflow-hidden p-2.5">
          <div className="pointer-events-none absolute -start-10 -top-16 h-28 w-52 rounded-full bg-(--shell-blue)/10 blur-3xl" />

          <div className="shell-account-card relative mb-2 flex items-center gap-2.5 p-2.5">
            <span className={cn(AVATAR_FACE, "size-[44px] text-[13px]")}>
              {initials(displayName, username)}
            </span>

            <div className="min-w-0 flex-1">
              <b className="block truncate text-[13px] font-extrabold tracking-[-0.02em] text-(--shell-ink)">
                {displayName || username}
              </b>

              <span
                className="mt-0.5 block truncate text-[10px] text-(--shell-muted)"
                title={username || undefined}
              >
                {username}
              </span>

              <em
                className={cn(
                  "mt-1 inline-flex rounded-full px-2 py-[3px]",
                  "bg-[color-mix(in_srgb,var(--shell-blue)_14%,var(--shell-mix-base))]",
                  "text-[9px] font-extrabold uppercase tracking-[0.04em]",
                  "not-italic text-(--shell-blue)",
                  "shadow-(--shell-inset)",
                )}
              >
                {role || "user"}
              </em>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "shell-account-action group flex h-[42px] w-full items-center gap-2 rounded-[12px] px-2.5",
              "text-[12px] font-bold text-(--shell-ink)",
            )}
          >
            <span
              className={cn(
                "grid size-[28px] place-items-center rounded-full",
                "[border:var(--ui-control-border)]",
                "bg-(image:--ui-control-bg)",
                "shadow-(--ui-control-shadow)",
                "group-hover:bg-[color-mix(in_srgb,var(--color-negative)_10%,var(--shell-mix-base))]",
              )}
            >
              <LogOut className="h-[14px] w-[14px]" />
            </span>

            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 


export function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { logout, displayName, username, role } = useAuth();
  const { headerPin, sidebarMode, palette, accent, showClock } = useUiPrefs();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });

  const compactNav = useCompactNavRail();
  const collapsed = sidebarMode === "collapsed" || (sidebarMode === "auto" && autoCollapsed);
  const iconOnly = collapsed || compactNav;
  const showCollapse = sidebarMode === "auto";

  const toggleCollapsed = () => {
    setAutoCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  const { data: pendingFees } = useQuery({
    queryKey: ["fee-pending"],
    queryFn: getFeePendingCount,
    refetchInterval: 30_000,
    retry: false,
    enabled: !isNavLocked("/fees"),
  });
  const pendingCount = pendingFees?.count ?? 0;

  return (
    <div
      className="shell-app flex min-h-screen flex-col text-(--shell-ink) md:h-svh md:overflow-hidden md:p-0"
      data-palette={palette}
      data-accent={accent.startsWith("#") ? "custom" : accent}
      data-header-pin={headerPin}
      style={{
        fontFamily: "var(--app-font-sans)",
        "--shell-header-h": "72px",
        "--shell-gap": "16px",
        "--shell-inline-end": "20px",
        "--shell-sidebar-width": iconOnly ? `${SIDEBAR_COLLAPSED_W}px` : `${SIDEBAR_EXPANDED_W}px`,
      } as CSSProperties}
    >
      <div className="shell-float mx-3 mt-3 flex items-center justify-between rounded-[21px] border border-(--shell-border) bg-(image:--shell-header-bg) px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <BrandLogo variant="wordmark" className="h-9 w-auto max-w-[168px] object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <FullscreenToggle compact />
          <LanguageSwitcher compact />
          <DisplaySettingsMenu />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={SHELL_CIRCLE} aria-label={t("nav.openNavigation")}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="h-full w-[min(260px,90vw)] border-0 bg-transparent p-3">
              <SidebarContent
                location={location}
                username={username}
                role={role}
                displayName={displayName}
                onLogout={logout}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div
        className={cn(
          "shell-frame relative flex min-h-0 w-full flex-1 flex-col overflow-visible",
          "md:rounded-none md:border-0 md:bg-transparent md:shadow-none",
        )}
      >
        <header
          className={cn(
            "shell-header-layer relative hidden min-h-(--shell-header-h) w-full shrink-0 items-center overflow-visible border-b border-(--shell-line) bg-(image:--shell-header-bg) md:flex",
            headerPin === "sticky" && "sticky top-0",
          )}
        >
          <div className="flex min-h-(--shell-header-h) w-full min-w-0 items-stretch">
            <div
              className={cn(
                "shell-header-brand relative flex w-(--shell-sidebar-width) shrink-0 items-center overflow-visible border-e border-(--shell-line) transition-[width] duration-[280ms] ease-out",
                iconOnly ? "justify-center px-2" : "justify-between gap-2 px-3.5",
              )}
            >
              <Link href="/" className="flex min-w-0 items-center" aria-label="QSC">
                {iconOnly ? (
                  <BrandLogo variant="mark" className="h-8 w-8 object-contain" />
                ) : (
                  <BrandLogo variant="wordmark" className="h-9 w-auto max-w-[168px] object-contain" />
                )}
              </Link>
              {showCollapse && iconOnly ? (
                <SidebarCollapseButton
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                  expandLabel={t("nav.expandSidebar")}
                  collapseLabel={t("nav.collapseSidebar")}
                  className="absolute end-0 top-1/2 z-50 -translate-y-1/2 ltr:translate-x-1/2 rtl:-translate-x-1/2"
                />
              ) : null}
              {showCollapse && !iconOnly ? (
                <SidebarCollapseButton
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                  expandLabel={t("nav.expandSidebar")}
                  collapseLabel={t("nav.collapseSidebar")}
                  className="shrink-0"
                />
              ) : null}
            </div>

            <div className="shell-header-main flex min-w-0 flex-1 items-center justify-between gap-4 px-4 pe-5">
              <MenuSearch onPick={setLocation} username={username} role={role} />
              <div className="ms-auto flex shrink-0 items-center gap-[13px]">
                {showClock ? <LiveClock /> : null}
                {isNavLocked("/fees") ? null : (
                <Link
                  href="/fees"
                  className={SHELL_CIRCLE}
                  aria-label={pendingCount > 0 ? t("nav.pendingFees", { count: pendingCount }) : t("nav.fees")}
                >
                  <img src="/notification.png" alt="" className={SHELL_ACTION_ICON} />
                  {pendingCount > 0 ? (
                    <span className="absolute -end-0.5 -top-[7px] grid h-[23px] min-w-[23px] place-items-center rounded-full bg-(--shell-blue) px-[5px] text-xs font-extrabold text-white">
                      {pendingCount}
                    </span>
                  ) : null}
                </Link>
                )}
                <FullscreenToggle />
                <LanguageSwitcher />
                <DisplaySettingsMenu />
                <AccountMenu displayName={displayName} username={username} role={role} onLogout={logout} />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden">
          <aside
            className={cn(
              "shell-sidebar-layer app-sidebar-desktop relative hidden h-auto w-(--shell-sidebar-width) shrink-0 self-stretch overflow-visible isolation-isolate border-e border-(--shell-line) transition-[width] duration-[280ms] ease-out md:block",
            )}
          >
            <SidebarContent
              location={location}
              username={username}
              role={role}
              displayName={displayName}
              onLogout={logout}
              iconOnly={iconOnly}
              showCollapse={false}
              collapsed={collapsed}
              embedded
            />
          </aside>

          <div className="shell-main shell-body-layer relative flex min-h-0 w-full min-w-0 flex-[1_1_0] flex-col">
            <main className="page-canvas relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-transparent px-5 py-2 md:px-6 md:py-4">
              <div className="page-canvas-inner mx-auto max-w-[1440px] animate-[ipms-fade-up_var(--duration-complex)_var(--ease-out)]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
