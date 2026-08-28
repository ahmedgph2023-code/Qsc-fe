import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

/** Maps API/status snake_case values to `common.*` camelCase keys. */
const COMMON_KEYS: Record<string, string> = {
  fully_shariah: "fullyShariah",
  unrestricted: "unrestricted",
  shariah: "shariah",
  not_shariah: "notShariah",
  pending: "pending",
  approved: "approved",
  amended: "amended",
  closed: "closed",
  missing: "missing",
  draft: "draft",
  executed: "executed",
  final: "final",
  cancelled: "cancelled",
  pass: "pass",
  fail: "fail",
  warn: "warn",
  open: "open",
  resolved: "resolved",
  waived: "waived",
  requested: "requested",
  rejected: "rejected",
};

function toneFor(value: string) {
  if (["approved", "pass", "resolved", "final", "executed"].includes(value)) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }
  if (["closed", "missing", "fail", "cancelled", "rejected", "critical"].includes(value)) {
    return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  }
  if (["pending", "amended", "draft", "warn", "warning", "open", "requested", "waived"].includes(value)) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border-maroon/40 bg-maroon/10 text-foreground";
}

export function MandateBadge({ value }: { value?: string | null }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-muted-foreground">{t("common.na")}</span>;
  const key = COMMON_KEYS[value];
  const label = key ? t(`common.${key}`) : value.replaceAll("_", " ");
  return (
    <Badge variant="outline" className={`mandate-chip ${toneFor(value)}`}>
      {label}
    </Badge>
  );
}
