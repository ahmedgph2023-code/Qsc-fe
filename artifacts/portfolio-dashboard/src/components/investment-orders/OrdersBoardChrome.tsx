import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the Investment Manager board: a navy section header with an
 * Arabic title, an English subtitle and room for badges or tabs on the end.
 */
export function BoardSection({
  title,
  subtitle,
  end,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  end?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("clients-table-card overflow-hidden", className)}>
      <header className="flex flex-wrap items-center gap-3 bg-[#16305f] px-4 py-2.5">
        {end}
        <div className="ms-auto flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#e3b341]">{subtitle}</span>
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

/** Count chip on a section header, e.g. the number of clients with balances. */
export function BoardBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "buy" | "sell" }) {
  const tones = {
    neutral: "bg-[#24406f] text-white",
    buy: "bg-[#e7f6ee] text-[#1a7f4b]",
    sell: "bg-[#fdeaea] text-[#b42318]",
  } as const;
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>{children}</span>
  );
}

/** Soft buy/sell pill used on both order tables (mockup pastels, not neon). */
export function SidePill({ side, buyLabel, sellLabel }: { side: string; buyLabel: string; sellLabel: string }) {
  const buy = side.toLowerCase() === "buy";
  return (
    <span
      className={cn(
        "inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold",
        buy
          ? "border-[#b7e4c9] bg-[#eefaf3] text-[#1a7f4b]"
          : "border-[#f3c0bd] bg-[#fdefee] text-[#b42318]",
      )}
    >
      {buy ? buyLabel : sellLabel}
    </span>
  );
}

/** Outlined pill for validity and status, per the detailed-orders mockup. */
export function OutlinePill({ children, tone }: { children: ReactNode; tone: "gtc" | "day" | "status" }) {
  const tones = {
    gtc: "border-[#d6c7f5] bg-[#f6f2ff] text-[#6941c6]",
    day: "border-[#bfe3ef] bg-[#f0fafd] text-[#0e7090]",
    status: "border-[#bcd4f6] bg-[#f0f6ff] text-[#175cd3]",
  } as const;
  return (
    <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}

export const boardTh =
  "h-10 bg-[#16305f] px-3 text-[10px] font-bold uppercase tracking-[0.5px] text-white";
export const boardCellPy = { paddingTop: 7, paddingBottom: 7 } as const;
