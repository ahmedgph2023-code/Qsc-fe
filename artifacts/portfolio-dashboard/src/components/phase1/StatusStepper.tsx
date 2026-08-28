import { Check } from "lucide-react";

export function StatusStepper({ steps, current }: { steps: string[]; current: string }) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.toLowerCase() === current.toLowerCase()));
  return (
    <div className="flex w-full items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return (
          <div key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
            <div className="flex min-w-[4.5rem] flex-col items-center gap-1.5">
              <div
                className={`grid h-8 w-8 place-items-center rounded-full border text-[11px] font-mono transition-all ${
                  complete
                    ? "border-emerald-500/60 bg-emerald-500 text-black shadow-[0_0_16px_rgba(16,185,129,0.25)]"
                    : active
                      ? "border-gold bg-gold/15 text-gold shadow-[0_0_18px_rgba(212,160,58,0.22)] scale-105"
                      : "border-border/80 bg-card/60 text-muted-foreground"
                }`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <span className={`whitespace-nowrap font-mono text-[9px] uppercase tracking-wider ${active ? "text-gold" : "text-muted-foreground"}`}>
                {step.replaceAll("_", " ")}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-1 mt-[-1.1rem] h-px min-w-4 flex-1 ${index < currentIndex ? "bg-emerald-500/70" : "bg-border/70"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
