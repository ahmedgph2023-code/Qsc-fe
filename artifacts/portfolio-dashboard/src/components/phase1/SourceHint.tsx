import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Hover hint: where a KPI / column figure comes from. */
export function SourceHint({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[#8a97b0]/45 shadow-none transition-colors hover:bg-transparent hover:text-[#6a7891]",
            className,
          )}
          aria-label={text}
        >
          <Info className="size-3.5" strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
