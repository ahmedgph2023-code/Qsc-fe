import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { isSameDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateLabel, formatYmd, parseYmd } from "@/components/phase1/DatePicker";

function normalizeRange(from: Date, to: Date): { from: Date; to: Date } {
  return from <= to ? { from, to } : { from: to, to: from };
}

function isBetweenExclusive(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  const lo = Math.min(start.getTime(), end.getTime());
  const hi = Math.max(start.getTime(), end.getTime());
  return t > lo && t < hi;
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  placeholder,
  max,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  className?: string;
  placeholder?: string;
  max?: string;
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.selectRange");
  const [open, setOpen] = useState(false);
  const [hoverDay, setHoverDay] = useState<Date | undefined>();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const maxDate = max ? parseYmd(max) : undefined;
  const committedFrom = parseYmd(from);
  const committedTo = parseYmd(to);

  useEffect(() => {
    if (open) {
      setDraftFrom(from);
      setDraftTo(to);
      setHoverDay(undefined);
    }
  }, [open, from, to]);

  const draftFromDate = parseYmd(draftFrom);
  const draftToDate = parseYmd(draftTo);
  const pickingEnd = Boolean(draftFromDate && !draftToDate);

  /** Only committed draft — never hover preview (avoids duplicate range_end/start). */
  const calendarSelected = useMemo((): DateRange | undefined => {
    if (draftFromDate && draftToDate) {
      return normalizeRange(draftFromDate, draftToDate);
    }
    if (draftFromDate) {
      return { from: draftFromDate, to: draftFromDate };
    }
    return undefined;
  }, [draftFromDate, draftToDate]);

  const previewEndDate =
    pickingEnd && hoverDay && draftFromDate && !isSameDay(draftFromDate, hoverDay)
      ? hoverDay
      : undefined;

  const label =
    from && to
      ? `${formatDateLabel(from)} – ${formatDateLabel(to)}`
      : from
        ? `${formatDateLabel(from)} – …`
        : resolvedPlaceholder;

  const hint = pickingEnd ? t("dateRange.selectEnd") : t("dateRange.selectStart");

  const footerLabel = useMemo(() => {
    if (pickingEnd && draftFrom) {
      if (previewEndDate) {
        const { from: start, to: end } = normalizeRange(draftFromDate!, previewEndDate);
        return `${formatDateLabel(formatYmd(start))} – ${formatDateLabel(formatYmd(end))}`;
      }
      return `${formatDateLabel(draftFrom)} – …`;
    }
    if (draftFrom && draftTo) {
      return `${formatDateLabel(draftFrom)} – ${formatDateLabel(draftTo)}`;
    }
    return null;
  }, [pickingEnd, draftFrom, draftTo, draftFromDate, previewEndDate]);

  const commitRange = (nextFrom: string, nextTo: string) => {
    onChange({ from: nextFrom, to: nextTo });
    setOpen(false);
    setHoverDay(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={from && to ? label : resolvedPlaceholder}
          className={cn(
            "control inline-flex w-full min-w-fit items-center gap-2 text-start",
            !from && !to && "text-muted-foreground",
            className,
          )}
        >
          <img
            src="/calendar-blue.png"
            alt=""
            className="size-[var(--ui-icon-size)] shrink-0 object-contain"
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-[var(--ui-control-muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto overflow-hidden rounded-[24px] border border-white/80 p-4 shadow-[0_22px_48px_rgba(61,88,145,0.18)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(236,242,255,0.94))]"
        align="end"
        sideOffset={8}
      >
        <p
          className={cn(
            "mb-3 rounded-full px-3 py-1.5 text-center text-[11px] font-bold tracking-wide",
            pickingEnd
              ? "bg-[#eef4ff] text-[#175cd3]"
              : "bg-[#f4f7fd] text-[#657491]",
          )}
        >
          {hint}
        </p>
        <Calendar
          mode="range"
          selected={calendarSelected}
          numberOfMonths={2}
          defaultMonth={draftFromDate ?? committedFrom ?? committedTo ?? new Date()}
          captionLayout="dropdown"
          startMonth={new Date(2010, 0)}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 2, 11)}
          disabled={maxDate ? [{ after: maxDate }] : undefined}
          modifiers={{
            preview_end: (date) =>
              Boolean(previewEndDate && isSameDay(date, previewEndDate)),
            preview_middle: (date) => {
              if (!previewEndDate || !draftFromDate) return false;
              const { from: start, to: end } = normalizeRange(draftFromDate, previewEndDate);
              return isBetweenExclusive(date, start, end);
            },
          }}
          onSelect={(_range, triggerDate) => {
            if (!triggerDate) return;
            if (maxDate && triggerDate > maxDate) return;

            if (!draftFromDate || draftToDate) {
              setDraftFrom(formatYmd(triggerDate));
              setDraftTo("");
              setHoverDay(undefined);
              return;
            }

            const { from: start, to: end } = normalizeRange(draftFromDate, triggerDate);
            commitRange(formatYmd(start), formatYmd(end));
          }}
          onDayMouseEnter={(day) => {
            if (pickingEnd) setHoverDay(day);
          }}
          onDayMouseLeave={() => {
            if (pickingEnd) setHoverDay(undefined);
          }}
        />
        {footerLabel ? (
          <p className="mt-3 border-t border-[#e1e7f0] pt-3 text-center text-[11px] font-semibold text-[#657491]">
            {footerLabel}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
