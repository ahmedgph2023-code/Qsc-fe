import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

export function parseYmd(value: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(value: string, fallback?: string): string {
  const date = parseYmd(value);
  return date ? format(date, "d MMM yyyy") : (fallback ?? i18n.t("common.selectDate"));
}

const DEFAULT_START = new Date(2010, 0, 1);
const DEFAULT_END = new Date(new Date().getFullYear() + 2, 11, 31);

export type DatePickerQuickDate = {
  date: string;
  rows?: number;
  stored?: boolean;
};

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder,
  prefix,
  id,
  min,
  max,
  dataDates,
  storedDates,
  quickDates,
}: {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  prefix?: string;
  id?: string;
  min?: string;
  max?: string;
  /** ISO dates (YYYY-MM-DD) with snapshot / SQL data — highlighted in the calendar. */
  dataDates?: string[];
  /** Subset of dataDates also stored in IPMS — stronger highlight. */
  storedDates?: string[];
  /** Snapshot dates shown as quick-access chips beside the calendar. */
  quickDates?: DatePickerQuickDate[];
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.selectDate");
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const minDate = min ? parseYmd(min) : undefined;
  const maxDate = max ? parseYmd(max) : undefined;

  const dataDateSet = useMemo(() => new Set(dataDates ?? []), [dataDates]);
  const storedDateSet = useMemo(() => new Set(storedDates ?? []), [storedDates]);
  const calendarModifiers = useMemo(
    () =>
      dataDateSet.size || storedDateSet.size
        ? {
            hasData: (date: Date) => dataDateSet.has(formatYmd(date)),
            inIpms: (date: Date) => storedDateSet.has(formatYmd(date)),
          }
        : undefined,
    [dataDateSet, storedDateSet],
  );
  const showLegend = Boolean(dataDates?.length);
  const showQuickPanel = Boolean(quickDates?.length);

  const pickDate = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={selected ? `Date ${formatDateLabel(value)}` : resolvedPlaceholder}
          className={cn(
            "control inline-flex w-full min-w-fit items-center gap-2 text-start",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <img
            src="/calendar-blue.png"
            alt=""
            className="size-[var(--ui-icon-size)] shrink-0 object-contain"
            aria-hidden
          />
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-start">
            {prefix && value ? (
              <>
                <span>{prefix}</span>
                <bdi className="truncate text-[length:inherit] tabular-nums text-[var(--shell-blue)]" dir="ltr">
                  {formatDateLabel(value)}
                </bdi>
              </>
            ) : (
              formatDateLabel(value, resolvedPlaceholder)
            )}
          </span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-[var(--ui-control-muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto overflow-hidden rounded-[24px] border border-white/80 p-4 shadow-[0_22px_48px_rgba(61,88,145,0.18)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(236,242,255,0.94))]",
          showQuickPanel && "max-w-none",
        )}
        align="end"
        sideOffset={8}
      >
        <div className={cn("flex items-start gap-0", showQuickPanel && "gap-4")}>
          <div className="min-w-0 shrink-0">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(day) => {
                if (!day) return;
                pickDate(formatYmd(day));
              }}
              defaultMonth={selected}
              captionLayout="dropdown"
              startMonth={minDate ?? DEFAULT_START}
              endMonth={maxDate ?? DEFAULT_END}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              modifiers={calendarModifiers}
            />
          </div>

          {showQuickPanel ? (
            <aside className="flex w-[11.5rem] shrink-0 flex-col border-s border-[#e1e7f0] ps-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#657491]">
                {t("balances.qscDates")}
              </p>
              <div className="mt-2 flex max-h-[17.5rem] flex-col gap-1.5 overflow-y-auto pe-0.5">
                {quickDates!.map((d) => {
                  const active = d.date === value;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => pickDate(d.date)}
                      className={cn(
                        "inline-flex min-h-9 w-full items-center justify-start rounded-md px-2.5 text-[11px] font-bold transition-colors",
                        active
                          ? "bg-[#175cd3] text-white"
                          : "bg-[#eef4ff] text-[#175cd3] hover:bg-[#dce8ff]",
                      )}
                    >
                      <span className="truncate">{d.date}</span>
                      {d.rows != null ? (
                        <span
                          className={cn(
                            "ms-auto shrink-0 ps-1 font-mono text-[10px]",
                            active ? "opacity-80" : "opacity-70",
                          )}
                        >
                          {d.rows}
                          {d.stored ? ` · ${t("balances.inIpms")}` : ""}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {showLegend ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-[#e1e7f0] pt-3 text-[10px] text-[#657491]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 shrink-0 rounded-full bg-[#eef4ff] ring-1 ring-[#175cd3]/20" />
                    {t("balances.calendarHasData")}
                  </span>
                  {storedDates?.length ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block size-3 shrink-0 rounded-full bg-[#dce8ff] ring-1 ring-[#175cd3]/35" />
                      {t("balances.calendarInIpms")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>

        {showLegend && !showQuickPanel ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#e1e7f0] pt-3 text-[10px] text-[#657491]">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full bg-[#eef4ff] ring-1 ring-[#175cd3]/20" />
              {t("balances.calendarHasData")}
            </span>
            {storedDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-full bg-[#dce8ff] ring-1 ring-[#175cd3]/35" />
                {t("balances.calendarInIpms")}
              </span>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
