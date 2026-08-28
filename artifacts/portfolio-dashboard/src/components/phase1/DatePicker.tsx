import { ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import { useState } from "react";
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
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("common.selectDate");
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const minDate = min ? parseYmd(min) : undefined;
  const maxDate = max ? parseYmd(max) : undefined;

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
                <bdi className="font-data truncate" dir="ltr">
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
        className="w-auto overflow-hidden rounded-[24px] border border-white/80 p-4 shadow-[0_22px_48px_rgba(61,88,145,0.18)] bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(236,242,255,0.94))]"
        align="end"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            if (!day) return;
            onChange(formatYmd(day));
            setOpen(false);
          }}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={minDate ?? DEFAULT_START}
          endMonth={maxDate ?? DEFAULT_END}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
        />
      </PopoverContent>
    </Popover>
  );
}
