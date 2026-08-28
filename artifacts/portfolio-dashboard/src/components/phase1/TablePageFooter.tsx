import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { SelectField } from "@/components/phase1/SelectField";
import { Skeleton } from "@/components/ui/skeleton";
import { visiblePageNumbers } from "@/lib/pageNumbers";
import { cn } from "@/lib/utils";

const navBtn =
  "grid size-[31px] place-items-center rounded-md border-0 bg-transparent text-inherit disabled:cursor-default disabled:opacity-35";

const pageBtn =
  "grid min-w-[31px] size-[31px] place-items-center rounded-[10px] border-0 px-1.5 text-[14px] font-extrabold";

export function TablePageFooter({
  total,
  page,
  pageSize,
  pageSizes,
  loading = false,
  onPageChange,
  onPageSizeChange,
  summary,
}: {
  total: number;
  page: number;
  pageSize: number;
  pageSizes: number[];
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  summary?: string;
}) {
  const { t } = useTranslation();
  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize;
  const numbers = visiblePageNumbers(safePage, pageCount);
  const rangeText =
    summary
    ?? (total === 0
      ? t("common.showingZero")
      : t("common.showingRange", {
          from: start + 1,
          to: Math.min(start + pageSize, total),
          total,
        }));

  return (
    <div className="clients-table-foot">
      <div>{loading ? <Skeleton className="h-3 w-48 rounded-full" /> : rangeText}</div>
      <div className="mx-auto flex flex-wrap items-center justify-center gap-1 text-muted-foreground max-[900px]:mx-0 max-[900px]:justify-between">
        <button type="button" className={navBtn} disabled={safePage <= 1} onClick={() => onPageChange(1)} aria-label={t("common.firstPage")}>
          <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button type="button" className={navBtn} disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))} aria-label={t("common.previousPage")}>
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
        </button>
        {numbers.map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="grid size-[31px] place-items-center text-[13px] font-bold">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                pageBtn,
                item === safePage
                  ? "bg-[var(--shell-blue)] text-white shadow-[0_8px_14px_color-mix(in_srgb,var(--shell-blue)_36%,transparent),inset_1px_1px_2px_rgba(255,255,255,0.45)]"
                  : "bg-transparent text-inherit hover:bg-[color-mix(in_srgb,var(--shell-blue)_10%,transparent)]",
              )}
              aria-current={item === safePage ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ),
        )}
        <button type="button" className={navBtn} disabled={safePage >= pageCount} onClick={() => onPageChange(Math.min(pageCount, safePage + 1))} aria-label={t("common.nextPage")}>
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </button>
        <button type="button" className={navBtn} disabled={safePage >= pageCount} onClick={() => onPageChange(pageCount)} aria-label={t("common.lastPage")}>
          <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
        </button>
      </div>
      <div className="ms-auto flex items-center gap-3 max-[900px]:ms-0 max-[900px]:justify-between">
        <span>{t("common.rowsPerPage")}:</span>
        <SelectField
          className="h-[38px] w-[5.6rem] min-w-[5.6rem]"
          contentClassName="clients-select-content"
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          aria-label={t("common.rowsPerPage")}
          options={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
        />
      </div>
    </div>
  );
}
