import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY = "__empty__";

export type SelectOption = { value: string; label: string };

export function SelectField({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  contentClassName,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const mapped = value === "" ? EMPTY : value;
  return (
    <Select
      value={mapped}
      onValueChange={(next) => onValueChange(next === EMPTY ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger className={cn("min-w-36", className)} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((opt) => {
          const itemValue = opt.value === "" ? EMPTY : opt.value;
          return (
            <SelectItem key={itemValue} value={itemValue}>
              {opt.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
