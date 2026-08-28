import { cn } from "@/lib/utils";

export const BRAND_ASSETS = {
  full: "/logo.png", 
  wordmark: "/small-logo.png",
  mark: "/logo-mark.png",
  dark: "/logo-dark.png",
} as const;

type BrandVariant = keyof typeof BRAND_ASSETS;

const ALT: Record<BrandVariant, string> = {
  full: "Qatar Securities Co.",
  wordmark: "QSC",
  mark: "QSC",
  dark: "Qatar Securities Co.",
};

export function BrandLogo({
  variant = "full",
  alt,
  className,
  decorative = false,
}: {
  variant?: BrandVariant;
  alt?: string;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <img
      src={BRAND_ASSETS[variant]}
      alt={decorative ? "" : (alt ?? ALT[variant])}
      className={cn("brand-logo", `brand-logo-${variant}`, className)}
      draggable={false}
    />
  );
}
