import { forwardRef, useEffect, useRef, useState, type ReactNode } from "react";
import { Filter, Inbox, Search } from "lucide-react";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { SourceHint } from "@/components/phase1/SourceHint";
import { TableSkeletonRows } from "@/components/phase1/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { SHELL_ACTION_ICON, SHELL_CIRCLE, SHELL_CIRCLE_OPEN } from "@/components/layout/shellChrome";
import { cn } from "@/lib/utils";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const DataTableIconBtn = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    src?: string;
    icon?: ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }
>(function DataTableIconBtn({ label, src, icon, active, disabled, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      data-state={active ? "open" : "closed"}
      className={cn(SHELL_CIRCLE, active && SHELL_CIRCLE_OPEN)}
      onClick={onClick}
    >
      {src ? <img src={src} alt="" className={SHELL_ACTION_ICON} /> : icon}
    </button>
  );
});

/** Brief busy flag when the page/size changes locally, so the table does not snap. */
export function useTablePageBusy(page: number, pageSize: number, ms = 160) {
  const [busy, setBusy] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    setBusy(true);
    const id = window.setTimeout(() => setBusy(false), ms);
    return () => window.clearTimeout(id);
  }, [page, pageSize, ms]);

  return busy;
}

export const CLIENT_PAGE_SIZES = [10, 25, 50];

export function useClientTablePage<T>(items: T[], resetKey = "") {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(CLIENT_PAGE_SIZES[0]);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const start = total === 0 ? 0 : (safePage - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  const busy = useTablePageBusy(safePage, pageSize);

  return {
    page: safePage,
    pageSize,
    pageSizes: CLIENT_PAGE_SIZES,
    setPage,
    setPageSize,
    paged,
    total,
    start,
    busy,
  };
}

export function ClientTableFooter({
  paging,
}: {
  paging: {
    total: number;
    page: number;
    pageSize: number;
    pageSizes: number[];
    busy: boolean;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };
}) {
  return (
    <TablePageFooter
      total={paging.total}
      page={paging.page}
      pageSize={paging.pageSize}
      pageSizes={paging.pageSizes}
      loading={paging.busy}
      onPageChange={paging.setPage}
      onPageSizeChange={paging.setPageSize}
    />
  );
}

export function DataTableEmpty({
  colSpan,
  icon,
  title,
  description,
}: {
  colSpan: number;
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="!p-0">
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div
            className="grid size-16 place-items-center rounded-full border border-[#dbe3ed] bg-[linear-gradient(145deg,#fbfdff,#eef3fb)] text-[#6a7891] shadow-[inset_1px_1px_2px_#fff,0_8px_16px_rgba(70,91,145,0.08)]"
            aria-hidden
          >
            {icon ?? <Inbox className="size-7" strokeWidth={1.5} />}
          </div>
          <div>
            <p className="text-[15px] font-bold text-[var(--shell-ink)]">{title}</p>
            {description ? (
              <p className="mt-1 max-w-sm text-[13px] text-[var(--shell-muted)]">{description}</p>
            ) : null}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DataTableSkeletonRows({
  cols,
  rows,
  rowHeight = 44,
}: {
  cols: number;
  rows: number;
  rowHeight?: number;
}) {
  return (
    <TableSkeletonRows
      cols={cols}
      rows={rows}
      rowHeight={rowHeight}
      rowClassName="clients-row pointer-events-none hover:bg-transparent"
    />
  );
}

/** Customer-page table chrome: card, inner grid, optional toolbar/footer. */
export function AppTable({
  children,
  toolbar,
  footer,
  className,
  tableClassName,
  wrapClassName,
  loading,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tableClassName?: string;
  wrapClassName?: string;
  loading?: boolean;
}) {
  return (
    <section className={cn("clients-table-card overflow-hidden", className)} aria-busy={loading || undefined}>
      {toolbar}
      <Table
        wrapClassName={cn("clients-table-wrap overflow-x-auto", wrapClassName)}
        className={tableClassName}
      >
        {children}
      </Table>
      {footer}
    </section>
  );
}

export function DataTableHead({
  children,
  hint,
  align = "start",
  className,
}: {
  children: ReactNode;
  hint?: string;
  align?: "start" | "end";
  className?: string;
}) {
  return (
    <TableHead
      className={cn(
        "h-10 font-mono text-[10px] font-extrabold uppercase tracking-[0.05em] text-[var(--shell-muted)]",
        align === "end" && "text-end",
        className,
      )}
    >
      <span className={cn("inline-flex items-center gap-1", align === "end" && "w-full justify-end")}>
        {children}
        {hint ? <SourceHint text={hint} className="size-5 border-0 bg-transparent shadow-none" /> : null}
      </span>
    </TableHead>
  );
}

export function DataTableToolbar({
  icon,
  count,
  countLoading,
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  hotkey = false,
  filterLabel,
  filterCount = 0,
  filterPanel,
  actions,
  className,
}: {
  icon?: string;
  count?: ReactNode;
  countLoading?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  hotkey?: boolean;
  filterLabel?: string;
  filterCount?: number;
  filterPanel?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showSearch = onSearchChange != null && searchPlaceholder != null && searchLabel != null;

  useEffect(() => {
    if (!hotkey || !showSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, showSearch]);

  return (
    <>
      <div className={cn("clients-table-toolbar", className)}>
        <div className="flex min-w-0 flex-1 items-center gap-3 text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-muted)] sm:text-base">
          {icon ? <img src={icon} alt="" className="clients-toolbar-icon shrink-0" /> : null}
          {count != null ? (
            <span className="min-w-0">
              {countLoading ? <Skeleton className="inline-block h-3.5 w-28 rounded-full align-middle" /> : count}
            </span>
          ) : null}
        </div>
        <div className="ms-auto flex shrink-0 flex-nowrap items-center gap-2.5 max-[900px]:ms-0 max-[900px]:w-full max-[900px]:flex-wrap">
          {showSearch ? (
            <label className="clients-table-search">
              <Search className="size-4 shrink-0 text-[var(--shell-muted)]" />
              <input
                ref={searchRef}
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchLabel}
              />
              {hotkey ? <span>{isMac ? "⌘K" : "Ctrl K"}</span> : null}
            </label>
          ) : null}
          {filterPanel ? (
            <button
              type="button"
              aria-label={filterLabel}
              title={filterLabel}
              aria-expanded={filtersOpen}
              className={cn(SHELL_CIRCLE, "relative", (filtersOpen || filterCount > 0) && SHELL_CIRCLE_OPEN)}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <Filter />
              {filterCount > 0 ? (
                <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-[var(--shell-blue)]" />
              ) : null}
            </button>
          ) : null}
          {actions}
        </div>
      </div>
      {filterPanel && filtersOpen ? (
        <div className="clients-filter-drawer">
          <div className="clients-filter-panel grid grid-cols-4 gap-3 max-[900px]:grid-cols-1">{filterPanel}</div>
        </div>
      ) : null}
    </>
  );
}

export function DataTableCard({
  icon,
  count,
  countLoading,
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  hotkey = false,
  filterLabel,
  filterCount = 0,
  filterPanel,
  actions,
  children,
  total,
  page,
  pageSize,
  pageSizes,
  onPageChange,
  onPageSizeChange,
  summary,
  tableClassName,
  loading,
}: {
  icon?: string;
  count: ReactNode;
  countLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchLabel: string;
  hotkey?: boolean;
  filterLabel: string;
  filterCount?: number;
  filterPanel?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  pageSizes: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  summary?: string;
  tableClassName?: string;
  loading?: boolean;
}) {
  return (
    <AppTable
      loading={loading || countLoading}
      tableClassName={cn("min-w-[820px] max-[900px]:block max-[900px]:w-full max-[900px]:min-w-0 [&_thead]:max-[900px]:hidden", tableClassName)}
      toolbar={
        <DataTableToolbar
          icon={icon}
          count={count}
          countLoading={countLoading}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          searchLabel={searchLabel}
          hotkey={hotkey}
          filterLabel={filterLabel}
          filterCount={filterCount}
          filterPanel={filterPanel}
          actions={actions}
        />
      }
      footer={
        <TablePageFooter
          total={total}
          page={page}
          pageSize={pageSize}
          pageSizes={pageSizes}
          loading={countLoading}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          summary={summary}
        />
      }
    >
      {children}
    </AppTable>
  );
}
