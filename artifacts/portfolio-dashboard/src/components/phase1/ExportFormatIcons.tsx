import { cn } from "@/lib/utils";

export const PDF_ICON_SRC = "/pdf.png";
export const EXCEL_ICON_SRC = "/excel.png";
export const FILE_ICON_SRC = "/file.png";
export const BALANCE_ICON_SRC = "/balance.png";

const base = "pointer-events-none shrink-0 object-contain";

export function PdfIcon({ className }: { className?: string }) {
  return <img src={PDF_ICON_SRC} alt="" aria-hidden className={cn(base, "size-5", className)} />;
}

export function ExcelIcon({ className }: { className?: string }) {
  return <img src={EXCEL_ICON_SRC} alt="" aria-hidden className={cn(base, "size-5", className)} />;
}

export function FileIcon({ className }: { className?: string }) {
  return <img src={FILE_ICON_SRC} alt="" aria-hidden className={cn(base, "size-5", className)} />;
}

export function BalanceIcon({ className }: { className?: string }) {
  return <img src={BALANCE_ICON_SRC} alt="" aria-hidden className={cn(base, "size-5", className)} />;
}
