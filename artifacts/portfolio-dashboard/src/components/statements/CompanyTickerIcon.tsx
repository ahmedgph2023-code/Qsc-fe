import { useState } from "react";
import { cn } from "@/lib/utils";

/** Public assets live at `/company-logos/{TICKER}.svg` (or .png). Missing file → letter badge. */
export function companyLogoSrc(ticker: string): string {
  const symbol = ticker.trim().toUpperCase();
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}company-logos/${encodeURIComponent(symbol)}.svg`;
}

export function CompanyTickerIcon({
  ticker,
  companyName,
  className,
}: {
  ticker: string;
  companyName?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const symbol = ticker.trim().toUpperCase() || "?";
  const letter = symbol.slice(0, 1);

  if (failed || !ticker.trim()) {
    return (
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-md bg-[#eef4ff] text-[11px] font-bold text-[#175cd3]",
          className,
        )}
        title={companyName || symbol}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      src={companyLogoSrc(symbol)}
      alt=""
      title={companyName || symbol}
      className={cn("size-7 shrink-0 rounded-md object-contain bg-white", className)}
      onError={() => setFailed(true)}
    />
  );
}
