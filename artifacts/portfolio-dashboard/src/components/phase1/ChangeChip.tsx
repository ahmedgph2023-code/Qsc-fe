import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";

export function ChangeChip({ pct }: { pct: number | null | undefined }) {
  if (pct == null || Number.isNaN(Number(pct))) return null;
  const n = Number(pct);
  const up = n >= 0;
  return (
    <span className={cn("hco-chip", up ? "is-gain" : "is-loss")}>
      {up ? "↑" : "↓"} <AnimatedNumber value={Math.abs(n)} format="percent" />
    </span>
  );
}

export function FloatingChip({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <div className="hco-chip-float">{children}</div>;
}
