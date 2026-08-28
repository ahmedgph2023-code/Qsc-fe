import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateLabel, formatYmd, parseYmd } from "@/components/phase1/DatePicker";

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  placeholder,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  className?: string;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.selectRange");
  const selected: DateRange | undefined =
    from || to
      ? { from: parseYmd(from), to: parseYmd(to) }
      : undefined;
  const label =
    from && to
      ? `${formatDateLabel(from)} – ${formatDateLabel(to)}`
      : from
        ? `${formatDateLabel(from)} – …`
        : resolvedPlaceholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "control inline-flex w-full min-w-0 items-center gap-2 text-start",
            !from && !to && "text-muted-foreground",
            className
          )}
        >
          <img
            src="/calendar-blue.png"
            alt=""
            className="size-[var(--ui-icon-size)] shrink-0 object-contain"
            aria-hidden
          />
          <span className="flex-1 truncate">{label}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-[var(--ui-control-muted)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden rounded-xl p-3 shadow-lg" align="start" sideOffset={6}>
        <Calendar
          mode="range"
          selected={selected}
          numberOfMonths={2}
          defaultMonth={parseYmd(from) ?? parseYmd(to)}
          captionLayout="dropdown"
          startMonth={new Date(2010, 0)}
          endMonth={new Date(new Date().getFullYear() + 2, 11)}
          onSelect={(range) =>
            onChange({
              from: range?.from ? formatYmd(range.from) : "",
              to: range?.to ? formatYmd(range.to) : "",
            })
          }
        />
      </PopoverContent>
    </Popover>
  );
}
