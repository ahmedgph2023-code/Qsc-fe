import type { ReactNode } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import {
  AppTable,
  DataTableEmpty,
  DataTableHead,
  DataTableSkeletonRows,
  DataTableToolbar,
  useClientTablePage,
} from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";

export type QuoteLogoTone = "blue" | "blue2" | "red" | "green";

export type QuoteBoardRow = {
  id: string;
  href?: string;
  logo: string;
  logoTone?: QuoteLogoTone;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  sparkline?: number[];
  price: ReactNode;
  priceCaption?: string;
  dayPct: number | null | undefined;
  actions?: ReactNode;
};

const LOGO_TONES: QuoteLogoTone[] = ["blue", "blue2", "red", "green"];

const LOGO_TONE_CLASS: Record<QuoteLogoTone, string> = {
  blue: "bg-[linear-gradient(145deg,#1f58e9,#1760f3)]",
  blue2: "bg-[linear-gradient(145deg,#11a3b0,#1760f3)]",
  red: "bg-[linear-gradient(145deg,#e24b57,#d12b3a)]",
  green: "bg-[linear-gradient(145deg,#18a270,#147a55)]",
};

export function quoteLogoTone(key: string): QuoteLogoTone {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return LOGO_TONES[hash % LOGO_TONES.length];
}

export function quoteLogoLabel(text: string, max = 4): string {
  const cleaned = text.replace(/[^\p{L}\p{N}]+/gu, "");
  return (cleaned.slice(0, max) || "?").toUpperCase();
}

export function sparkFromRange(start: number, end: number): number[] {
  const a = Number(start) || 0;
  const b = Number(end) || 0;
  if (a === 0 && b === 0) return [];
  const mid = a + (b - a) * 0.58;
  return [a, a + (b - a) * 0.18, mid, a + (b - a) * 0.82, b];
}

function buildSparkPath(values: number[], width = 208, height = 66) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const top = 8;
  const bottom = height - 6;
  const usable = bottom - top;
  const pts = values.map((value, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = top + (1 - (value - min) / span) * usable;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = `M${pts.join(" L")}`;
  return {
    line,
    area: `${line} L${width} ${height} L0 ${height} Z`,
    up: values[values.length - 1] >= values[0],
  };
}

export function QuoteSpark({
  id,
  values,
  up,
  className,
}: {
  id: string;
  values: number[];
  up: boolean;
  className?: string;
}) {
  const path = buildSparkPath(values);
  const gid = `qs-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (!path) return null;
  const stroke = up ? "#18a270" : "#e24b57";
  const fill = up ? "#18a270" : "#e24b57";
  return (
    <svg
      className={cn("block h-9 w-[4.5rem] max-w-full", className)}
      viewBox="0 0 208 66"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fill} />
          <stop offset="1" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${gid})`} className="opacity-[0.11]" />
      <path
        d={path.line}
        stroke={stroke}
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QuoteDayBadge({ pct, naLabel }: { pct: number | null | undefined; naLabel: string }) {
  if (pct == null || Number.isNaN(Number(pct))) {
    return <span className="text-[11px] text-[#7a879c]">{naLabel}</span>;
  }
  const n = Number(pct);
  const up = n >= 0;
  const abs = Math.abs(n);
  const digits = abs >= 1 ? 2 : abs >= 0.1 ? 3 : 4;
  return (
    <span className={cn("inline-flex items-center gap-0.5 whitespace-nowrap font-data text-[13px] font-semibold", up ? "text-gain" : "text-loss")}>
      <span className="text-[12px] font-medium leading-none">{up ? "↑" : "↓"}</span>
      {up ? "+" : "−"}
      {abs.toFixed(digits)}%
    </span>
  );
}

function QuoteAsset({
  row,
  className,
}: {
  row: QuoteBoardRow;
  className?: string;
}) {
  const tone = row.logoTone || quoteLogoTone(row.id || row.title);
  const inner = (
    <>
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-[12px] text-[10px] font-extrabold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] sm:size-11 sm:text-[11px]",
          LOGO_TONE_CLASS[tone],
        )}
      >
        {row.logo}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold leading-tight text-[#0e1837] group-hover:text-[#1760f3]">
          {row.title}
        </div>
        {row.subtitle ? (
          <div className="mt-0.5 truncate text-[11px] leading-tight text-[#7a879c]">
            {row.subtitle}
          </div>
        ) : null}
        {row.meta ? (
          <div className="mt-0.5 truncate text-[11px] text-[#7a879c]">{row.meta}</div>
        ) : null}
      </div>
    </>
  );

  const wrapClass = cn("group flex min-w-0 items-center gap-3", className);

  if (row.href) {
    return (
      <Link href={row.href} className={cn(wrapClass, "no-underline")}>
        {inner}
      </Link>
    );
  }
  return <div className={wrapClass}>{inner}</div>;
}

function QuoteActionLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn("no-underline", className)}>
      {children}
    </Link>
  );
}

export function QuoteBoard({
  title,
  subtitle,
  icon = "/analytics.png",
  actionHref,
  actionLabel,
  showBrandHeader = true,
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  hotkey = false,
  filterLabel,
  filterCount = 0,
  filterPanel,
  columns,
  rows,
  loading = false,
  showTrend = true,
  paginate = true,
  emptyTitle,
  emptyDescription,
  className,
}: {
  title?: string;
  subtitle?: string;
  icon?: string;
  actionHref?: string;
  actionLabel?: string;
  showBrandHeader?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  hotkey?: boolean;
  filterLabel?: string;
  filterCount?: number;
  filterPanel?: ReactNode;
  columns?: { asset?: string; trend?: string; price?: string; day?: string };
  rows: QuoteBoardRow[];
  loading?: boolean;
  showTrend?: boolean;
  paginate?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const na = t("common.na");
  const hasActions = rows.some((row) => row.actions);
  const resetKey = rows.map((row) => row.id).join("\0");
  const paging = useClientTablePage(rows, resetKey);
  const shown = paginate ? paging.paged : rows;
  const colCount = 3 + Number(showTrend) + Number(hasActions);
  const labels = {
    asset: columns?.asset ?? t("dashboard.colAsset"),
    trend: columns?.trend ?? t("dashboard.colTrend"),
    price: columns?.price ?? t("dashboard.colPrice"),
    day: columns?.day ?? t("dashboard.colDay"),
  };
  const showSkeleton = loading || (paginate && paging.busy);
  const leading = showBrandHeader ? (
    <div className="min-w-0">
      <span className="block truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">{title}</span>
      {subtitle ? <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--shell-muted)]">{subtitle}</span> : null}
    </div>
  ) : title ? (
    title
  ) : undefined;

  return (
    <AppTable
      className={className}
      loading={showSkeleton}
      toolbar={
        <DataTableToolbar
          icon={icon}
          count={leading}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          hotkey={hotkey}
          filterLabel={filterLabel}
          filterCount={filterCount}
          filterPanel={filterPanel}
          actions={
            actionHref && actionLabel ? (
              <QuoteActionLink
                href={actionHref}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-[#dfe6f6] bg-[linear-gradient(145deg,#fff,#eef3fd)] px-3.5 text-[12.5px] font-bold text-[#203c72] shadow-[0_6px_14px_rgba(57,82,143,0.08)] transition hover:-translate-y-px hover:text-[#1760f3]"
              >
                <img src="/apps.png" alt="" className="size-4 object-contain" />
                {actionLabel}
              </QuoteActionLink>
            ) : undefined
          }
        />
      }
      footer={
        paginate ? (
          <TablePageFooter
            total={paging.total}
            page={paging.page}
            pageSize={paging.pageSize}
            pageSizes={paging.pageSizes}
            loading={loading}
            onPageChange={paging.setPage}
            onPageSizeChange={paging.setPageSize}
          />
        ) : undefined
      }
    >
      <TableHeader>
        <TableRow className="clients-thead-row h-10">
          <DataTableHead className="ps-5">{labels.asset}</DataTableHead>
          {showTrend ? <DataTableHead>{labels.trend}</DataTableHead> : null}
          <DataTableHead>{labels.price}</DataTableHead>
          <DataTableHead>{labels.day}</DataTableHead>
          {hasActions ? <DataTableHead className="w-12 pe-5">{""}</DataTableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {showSkeleton ? (
          <DataTableSkeletonRows cols={colCount} rows={paginate ? paging.pageSize : 5} rowHeight={58} />
        ) : shown.length === 0 ? (
          <DataTableEmpty colSpan={colCount} title={emptyTitle} description={emptyDescription} />
        ) : (
          shown.map((row) => {
            const sparkUp = row.dayPct == null ? (row.sparkline?.[row.sparkline.length - 1] ?? 0) >= (row.sparkline?.[0] ?? 0) : row.dayPct >= 0;
            const spark = (row.sparkline || []).length > 1 ? row.sparkline : undefined;
            return (
              <TableRow key={row.id} className="clients-row">
                <TableCell title={row.title} className="ps-5 max-w-[200px] overflow-hidden text-ellipsis">
                  <QuoteAsset row={row} />
                </TableCell>
                {showTrend ? (
                  <TableCell>
                    {spark ? (
                      <QuoteSpark id={row.id} values={spark} up={sparkUp} />
                    ) : (
                      <span className="text-[11px] text-[#7a879c]">{na}</span>
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="whitespace-nowrap">
                  <div className="font-data text-[13px] font-semibold leading-none text-[#0e1837]">
                    {row.price}
                  </div>
                  {row.priceCaption ? (
                    <div className="mt-1 text-[11px] text-[#7a879c]">{row.priceCaption}</div>
                  ) : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <QuoteDayBadge pct={row.dayPct} naLabel={na} />
                </TableCell>
                {hasActions ? (
                  <TableCell className="pe-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">{row.actions}</div>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </AppTable>
  );
}
