import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY = "__empty__";

export type SelectOption = { value: string; label: string; search?: string; group?: string };

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  contentClassName,
  disabled,
  searchPlaceholder,
  emptyText,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  "aria-label"?: string;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const mapped = value === "" ? EMPTY : value;
  const hasEmptyOption = options.some((opt) => opt.value === "");
  const selectValue = value === "" && !hasEmptyOption ? undefined : mapped;
  const searchable = searchPlaceholder != null;

  const visible = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    const matched = !q
      ? options
      : options.filter((opt) => (opt.search ?? opt.label).toLowerCase().includes(q));
    const selected = options.find((opt) => opt.value === value);
    const selectedMatches = !!selected?.value && matched.some((opt) => opt.value === selected.value);
    if (selected?.value && (!q || selectedMatches)) {
      const rest = matched.filter((opt) => opt.value !== selected.value);
      return [selected, ...rest].slice(0, 80);
    }
    return matched.slice(0, 80);
  }, [options, query, searchable, value]);

  const grouped = useMemo(() => {
    const hasGroups = visible.some((opt) => opt.group);
    if (!hasGroups) return null;
    const map = new Map<string, SelectOption[]>();
    for (const opt of visible) {
      const g = opt.group || "All";
      const list = map.get(g) ?? [];
      list.push(opt);
      map.set(g, list);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onValueChange(next === EMPTY ? "" : next)}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        if (next && searchable) {
          requestAnimationFrame(() => searchRef.current?.focus());
        }
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("w-auto min-w-[8.5rem] max-w-full", className)} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {searchable ? (
          <div
            className="sticky top-0 z-10 mb-1 bg-white pb-1 dark:bg-[var(--color-surface-elevated)]"
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <label className="flex h-9 items-center gap-2 rounded-[10px] border border-[#e4ebf8] bg-[#f7f9fd] px-2.5">
              <Search className="size-3.5 shrink-0 text-[#8a97b0]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-[#16305f] outline-none placeholder:text-[#8a97b0]"
              />
            </label>
          </div>
        ) : null}
        {grouped
          ? grouped.map(([group, opts]) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {opts.map((opt) => {
                  const itemValue = opt.value === "" ? EMPTY : opt.value;
                  return (
                    <SelectItem key={itemValue} value={itemValue}>
                      {opt.label}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            ))
          : visible.map((opt) => {
              const itemValue = opt.value === "" ? EMPTY : opt.value;
              return (
                <SelectItem key={itemValue} value={itemValue}>
                  {opt.label}
                </SelectItem>
              );
            })}
        {searchable && visible.length === 0 ? (
          <div className="px-2 py-3 text-center text-[13px] text-[#8a97b0]">{emptyText ?? "—"}</div>
        ) : null}
      </SelectContent>
    </Select>
  );
}
