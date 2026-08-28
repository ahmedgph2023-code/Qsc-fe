import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export type AnimatedNumberFormat = "currency" | "compact" | "compactCurrency" | "percent" | "integer" | "decimal";

type AnimatedNumberProps = {
  value: number | null | undefined;
  format?: AnimatedNumberFormat;
  signed?: boolean;
  digits?: number;
  duration?: number;
  delay?: number;
  className?: string;
  empty?: string;
  loading?: boolean;
  /** Rendered before the number on the same line (e.g. ↗). */
  prefix?: string;
};

const QAR = new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" });
const QAR_BY_DIGITS = new Map<number, Intl.NumberFormat>();
const QAR_COMPACT = new Intl.NumberFormat("en-QA", {
  style: "currency",
  currency: "QAR",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2,
});
const COMPACT = new Intl.NumberFormat("en-QA", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

function formatQar(abs: number, digits?: number) {
  if (digits == null) return QAR.format(abs);
  let fmt = QAR_BY_DIGITS.get(digits);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    QAR_BY_DIGITS.set(digits, fmt);
  }
  return fmt.format(abs);
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function formatDisplayNumber(
  value: number,
  format: AnimatedNumberFormat = "decimal",
  opts: { signed?: boolean; digits?: number } = {},
) {
  const { signed = false, digits } = opts;
  const abs = Math.abs(value);
  let body: string;
  switch (format) {
    case "currency":
      body = formatQar(abs, digits);
      break;
    case "compactCurrency":
      body = QAR_COMPACT.format(abs);
      break;
    case "compact":
      body = COMPACT.format(abs);
      break;
    case "percent":
      body = `${abs.toFixed(digits ?? 2)}%`;
      break;
    case "integer":
      body = Math.round(abs).toLocaleString("en-QA");
      break;
    default:
      body = abs.toLocaleString("en-QA", {
        minimumFractionDigits: digits ?? 2,
        maximumFractionDigits: digits ?? 2,
      });
  }
  if (signed) {
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${body}`;
  }
  return value < 0 ? `−${body}` : body;
}

/**
 * Count-up number on a single line. Fit-to-width shrinks font-size based on the
 * final label width (not transform/absolute), so currency + digits stay aligned.
 */
export function AnimatedNumber({
  value,
  format = "decimal",
  signed = false,
  digits,
  duration = 1100,
  delay = 0,
  className,
  empty = "—",
  loading = false,
  prefix = "",
}: AnimatedNumberProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [fit, setFit] = useState(1);
  const valid = value != null && Number.isFinite(Number(value));
  const target = valid ? Number(value) : 0;
  const finalBody = valid ? formatDisplayNumber(target, format, { signed, digits }) : empty;
  const displayBody = valid ? formatDisplayNumber(shown, format, { signed, digits }) : empty;
  const finalLabel = `${prefix}${finalBody}`;
  const displayLabel = `${prefix}${displayBody}`;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const probe = probeRef.current;
    const column = root?.parentElement;
    if (!root || !probe) return;

    const apply = () => {
      // Measure the stable column, not the shrink-wrapped number box.
      // Observing the number itself causes a feedback loop that shrinks type to 55%.
      const avail = column?.clientWidth ?? root.clientWidth;
      const need = probe.scrollWidth;
      if (avail < 48 || need <= 0 || need <= avail) {
        setFit(1);
        return;
      }
      const next = Math.min(1, Math.max(0.8, (avail - 4) / need));
      setFit((prev) => (Math.abs(prev - next) < 0.008 ? prev : next));
    };

    apply();
    const ro = new ResizeObserver(apply);
    if (column) ro.observe(column);
    else ro.observe(root);
    return () => ro.disconnect();
  }, [finalLabel]);

  useEffect(() => {
    if (!valid) {
      setShown(0);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShown(target);
      return;
    }

    setShown(0);

    let raf = 0;
    const tick = (now: number, startAt: number) => {
      const t = Math.min(1, (now - startAt) / duration);
      const e = easeOutCubic(t);
      setShown(target * e);
      if (t < 1) raf = requestAnimationFrame((next) => tick(next, startAt));
      else setShown(target);
    };

    if (delay > 0) {
      const wait = window.setTimeout(() => {
        raf = requestAnimationFrame((now) => tick(now, now));
      }, delay);
      return () => {
        window.clearTimeout(wait);
        cancelAnimationFrame(raf);
      };
    }

    raf = requestAnimationFrame((now) => tick(now, now));
    return () => cancelAnimationFrame(raf);
  }, [target, valid, duration, delay]);

  if (loading) {
    return (
      <span className={cn("anim-num-root", className)} aria-hidden>
        <Skeleton className="inline-block h-[1.05em] w-[7.25rem] max-w-full rounded-full" />
      </span>
    );
  }

  return (
    <span ref={rootRef} className={cn("anim-num-root", className)} aria-label={finalLabel}>
      <span ref={probeRef} className="anim-num-probe" aria-hidden="true">
        {finalLabel}
      </span>
      <span className="anim-num" style={fit < 0.999 ? { fontSize: `${fit}em` } : undefined}>
        {displayLabel}
      </span>
    </span>
  );
}
