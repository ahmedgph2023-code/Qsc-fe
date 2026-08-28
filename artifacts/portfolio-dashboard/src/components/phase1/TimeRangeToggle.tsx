import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const DEFAULT_RANGES = ["1M", "3M", "6M", "1Y", "ALL"];

export function TimeRangeToggle({
  value,
  onChange,
  ranges = DEFAULT_RANGES,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  ranges?: string[];
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className={cn("segmented", className)}
      size="sm"
    >
      {ranges.map((range) => (
        <ToggleGroupItem key={range} value={range} className="font-mono text-xs">
          {range}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
