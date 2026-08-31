import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { AnimatedNumber, type AnimatedNumberFormat } from "@/components/phase1/AnimatedNumber";

export function PageHeader({
  eyebrow = "QSC · IPMS",
  title,
  description,
  actions,
  meta,
  className,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
  actionsClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
  actionsClassName?: string;
}) {
  return (
    <header className={cn("cdp-header animate-in", className)}>
      <div className={cn("cdp-title min-w-0 flex-1", eyebrowClassName)}>
        <h1 className={titleClassName}>{title}</h1>
        {description ? <p className={descriptionClassName}>{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className={cn("cdp-header-actions", actionsClassName)}>{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty-state", className)}>
      <div className="empty-state-art-wrap" aria-hidden="true">
        {icon ?? <EmptyTableArt />}
      </div>
      <h3 className="display-font text-2xl tracking-tight">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Compact centered empty for chart/list cards (client holdings panels, etc.). */
export function PanelEmptyState({
  icon,
  title,
  description,
  className,
  hideIcon = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  className?: string;
  /** When true, title + description only (no icon badge). */
  hideIcon?: boolean;
}) {
  const showIcon = !hideIcon;
  return (
    <div
      className={cn(
        "flex h-full min-h-[10rem] w-full flex-col items-center justify-center gap-3 px-5 py-8 text-center",
        className,
      )}
      role="status"
    >
      {showIcon ? (
        <div
          className="grid size-[4.25rem] place-items-center rounded-[22px] border border-[#d9e3f2] bg-[linear-gradient(160deg,#ffffff_0%,#f3f7fd_55%,#e8eef8_100%)] text-[#5f7191] shadow-[0_10px_24px_rgba(57,82,143,0.10),inset_1px_1px_0_#fff]"
          aria-hidden
        >
          {icon ?? (
            <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11Z" />
              <path d="M8 7.5V6a4 4 0 0 1 8 0v1.5" />
              <path d="M4 11h16" />
            </svg>
          )}
        </div>
      ) : null}
      <div className="max-w-[18rem]">
        <p className="text-[14.5px] font-extrabold tracking-tight text-[#0e1837]">{title}</p>
        {description ? (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#687892]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "filter-bar cdp-page-filters",
        "[&_.control]:w-auto [&_.control]:shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone,
  icon,
  loading,
  format,
  signed,
  digits,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "gain" | "loss" | "warn" | "gold";
  icon?: ReactNode;
  loading?: boolean;
  format?: AnimatedNumberFormat;
  signed?: boolean;
  digits?: number;
}) {
  const valueClass =
    tone === "gain" ? "text-gain" :
    tone === "loss" ? "text-loss" :
    tone === "warn" ? "text-[var(--color-warning)]" :
    tone === "gold" ? "text-[var(--color-primary-ink)]" : "";

  if (loading) {
    return (
      <div className="stat-tile">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Skeleton className="h-2.5 w-24" />
          {icon && <div className="rounded-md border border-transparent p-2 opacity-0"><span className="block h-4 w-4" /></div>}
        </div>
        <Skeleton className="h-[var(--data-size-kpi)] w-32" />
        {hint !== undefined && <Skeleton className="mt-3 h-3 w-16" />}
      </div>
    );
  }

  const numeric = typeof value === "number";

  return (
    <div className="stat-tile group">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        {icon && <div className="kpi-icon">{icon}</div>}
      </div>
      <div className={`min-w-0 overflow-visible font-data-kpi font-bold ${valueClass}`}>
        {numeric ? (
          <AnimatedNumber value={value} format={format ?? "integer"} signed={signed} digits={digits} />
        ) : value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function EmptyTableArt() {
  return (
    <svg viewBox="0 0 160 120" className="empty-state-art" aria-hidden>
      <rect x="24" y="18" width="112" height="84" rx="18" fill="#eef3fb" stroke="#c9d6ea" />
      <rect x="38" y="36" width="84" height="9" rx="4.5" fill="#c5d3ea" />
      <rect x="38" y="54" width="58" height="8" rx="4" fill="#d7e1f2" />
      <rect x="38" y="70" width="70" height="8" rx="4" fill="#d7e1f2" />
      <rect x="38" y="86" width="46" height="8" rx="4" fill="#e3eaf6" />
      <circle cx="124" cy="30" r="16" fill="#f7faff" stroke="#c9d6ea" />
      <path d="M124 24v12M118 30h12" stroke="#6a7891" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Placeholder rows for tables while their query is loading. Column count should match the real `<TableRow>`. */
export function TableSkeletonRows({
  rows = 6,
  cols,
  rowClassName,
  rowHeight,
}: {
  rows?: number;
  cols: number;
  rowClassName?: string;
  rowHeight?: number;
}) {
  const widths = ["92%", "64%", "78%", "48%", "70%", "40%"];
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r} className={cn("pointer-events-none hover:bg-transparent", rowClassName)}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c} style={rowHeight ? { height: rowHeight } : undefined}>
              <Skeleton
                className="h-3.5 max-w-[11rem] rounded-full"
                style={{ width: widths[(r + c) % widths.length], animationDelay: `${(r * cols + c) * 22}ms` }}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
