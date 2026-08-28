import type { CSSProperties, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceHint } from "@/components/phase1/SourceHint";
import { cn } from "@/lib/utils";

const DEFAULT_ICON_SIZE = 40;

export type StatsSummaryItem = {
  id: string;
  icon: string;
  label: string;
  value: ReactNode;
  hint: string;
  /** Hover text explaining where the figure comes from (sheet import only). */
  info?: string;
  valueClassName?: string;
  /** Override icon image size (px) for this item only. Falls back to bar `iconSize`, then default. */
  iconSize?: number;
};

/**
 * Horizontal KPI summary band (Clients / Dashboard / Customer Detail).
 * Desktop: up to `columns` per row with vertical dividers. Tablet: 2×N. Phone: stacked.
 */
export function StatsSummaryBar({
  items,
  loading = false,
  ariaLabel = "Summary metrics",
  className,
  /** Absolute icon image size in px. Default: 40. Per-item `iconSize` overrides this. */
  iconSize,
  /** Max columns from xl breakpoint. Default 4 (Home pattern). */
  columns = 4,
  /** Tighter padding / typography for in-tab KPI strips. */
  compact = false,
  /** Larger tiles, icons, and labels (Clients 2 summary). */
  size = "default",
}: {
  items: StatsSummaryItem[];
  loading?: boolean;
  ariaLabel?: string;
  className?: string;
  iconSize?: number;
  columns?: 3 | 4;
  compact?: boolean;
  size?: "default" | "lg";
}) {
  const large = size === "lg" && !compact;
  const colClass =
    columns === 3
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "grid overflow-visible rounded-[28px] border border-white/95 bg-[linear-gradient(160deg,#ffffff_0%,#f7f9ff_100%)] shadow-[0_18px_40px_rgba(57,82,143,0.10),inset_1px_1px_0_#fff]",
        colClass,
        compact && "rounded-[22px]",
        large && "rounded-[32px]",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const px = item.iconSize ?? iconSize ?? (large ? 72 : DEFAULT_ICON_SIZE);
        const iconStyle: CSSProperties = { width: px, height: px };

        return (
          <div
            key={item.id}
            className={cn(
              "relative flex min-w-0 items-center gap-4 border-[#e6ecf7]",
              item.info && "pe-9 pt-1",
              compact
                ? "gap-3 px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4"
                : large
                  ? "gap-5 px-6 py-6 sm:gap-6 sm:px-8 sm:py-7"
                  : "px-5 py-5 sm:gap-5 sm:px-6 sm:py-6",
              !isLast && "border-b",
              "sm:border-b-0 sm:[&:nth-child(-n+2)]:border-b",
              "sm:border-e sm:[&:nth-child(2n)]:border-e-0",
              columns === 3
                ? "xl:border-b-0 xl:border-e xl:[&:nth-child(3n)]:border-e-0 xl:[&:nth-child(2n)]:border-e"
                : "xl:border-b-0 xl:border-e xl:[&:nth-child(2n)]:border-e xl:[&:nth-child(4n)]:border-e-0 xl:last:border-e-0",
            )}
          >
            {item.info ? (
              <div className="absolute top-2 end-2 z-10">
                <SourceHint text={item.info} />
              </div>
            ) : null}
            <div
              className={cn(
                "relative grid shrink-0 place-items-center overflow-hidden rounded-[18px] border border-white",
                compact && "size-[48px] sm:size-[52px] sm:rounded-[16px]",
                !compact && large && "size-[84px] rounded-[22px] sm:size-[96px] sm:rounded-[26px]",
                !compact && !large && "size-[58px] sm:size-[64px] sm:rounded-[20px]",
              )}
              aria-hidden
            >
              <img
                src={item.icon}
                alt=""
                className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
                style={iconStyle}
              />
            </div>
            <div className="min-w-0 flex-1 text-start leading-none">
              <p
                className={cn(
                  "font-semibold leading-snug text-[#5b6e96]",
                  compact && "text-[11px] sm:text-[12px]",
                  large && "text-[13px] tracking-[-0.01em] sm:text-[15px]",
                  !compact && !large && "text-[12px] sm:text-[13px]",
                )}
              >
                {item.label}
              </p>
              <div
                className={cn(
                  "mt-0.5 min-w-0 w-full overflow-visible text-start font-extrabold leading-none tracking-[-0.03em] text-[#0e1837]",
                  compact && "text-[1.15rem] sm:text-[1.3rem]",
                  large && "text-[1.7rem] tracking-[-0.04em] sm:text-[2.05rem]",
                  !compact && !large && "text-[1.45rem] sm:text-[1.7rem]",
                  item.valueClassName,
                )}
              >
                {loading ? (
                  <Skeleton className={cn("inline-block rounded-full", compact ? "h-6 w-20" : large ? "h-8 w-28 sm:h-10 sm:w-36" : "h-7 w-24 sm:h-8 sm:w-28")} />
                ) : (
                  item.value
                )}
              </div>
              <p className={cn(
                "leading-snug text-[#8a97b0] [unicode-bidi:plaintext]",
                compact && "mt-1 text-[10px] sm:text-[11px]",
                large && "mt-1 text-[12px] sm:text-[13px]",
                !compact && !large && "mt-1 text-[11px] sm:text-[12px]",
              )}>
                {item.hint}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
