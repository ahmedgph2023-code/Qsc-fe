import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import i18n from "@/i18n";

/** Opens a print window with HTML body (P1-PRINT / report packs). */
export function openPrintDocument(title: string, bodyHtml: string) {
  const lang = i18n.language === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font =
    lang === "ar"
      ? "'Cairo','Alexandria',Segoe UI,Arial,sans-serif"
      : "Segoe UI,Arial,sans-serif";
  const html = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
<style>
  body{font-family:${font};color:#111;margin:24px;font-size:12px;line-height:1.45}
  h1{font-size:18px;margin:0 0 4px} h2{font-size:14px;margin:18px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .meta{color:#555;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin:8px 0 16px}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:start} th{background:#f3f3f3}
  .num{text-align:end;font-variant-numeric:tabular-nums} .muted{color:#666}
  @media print{body{margin:12mm}}
</style></head><body>
${bodyHtml}
<script>window.onload=function(){window.focus();window.print();}</script>
</body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "width=900,height=700");
  if (!w) {
    URL.revokeObjectURL(url);
    window.alert(i18n.t("common.allowPopups"));
    return;
  }
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function PrintButton({
  title,
  buildHtml,
  label,
  variant = "outline",
  size = "sm",
}: {
  title: string;
  buildHtml: () => string;
  label?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => openPrintDocument(title, buildHtml())}
    >
      <Printer className="me-2 h-4 w-4" />
      {label ?? t("common.print")}
    </Button>
  );
}
