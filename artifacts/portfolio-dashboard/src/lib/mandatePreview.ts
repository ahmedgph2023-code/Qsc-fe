export type ShariahPreference = "fully_shariah" | "unrestricted";
export type ShariahStatus = "shariah" | "not_shariah";
export type RiskProfile = "medium" | "high";

const MODEL_CODE: Record<`${ShariahPreference}:${RiskProfile}`, string> = {
  "fully_shariah:medium": "FS_MED",
  "fully_shariah:high": "FS_HIGH",
  "unrestricted:medium": "UN_MED",
  "unrestricted:high": "UN_HIGH",
};

export function normalizeShariahGroup(raw?: string | null): ShariahStatus | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  if (v === "shariah" || v === "a" || v === "yes" || v === "y") return "shariah";
  if (v === "not_shariah" || v === "not shariah" || v === "b" || v === "c" || v === "no" || v === "n") return "not_shariah";
  return null;
}

export function shariahGroupLabel(raw?: string | null): string {
  const n = normalizeShariahGroup(raw);
  if (n === "shariah") return "Shariah";
  if (n === "not_shariah") return "Not Shariah";
  return "Unclassified";
}

export function normalizePreference(pref?: string | null): ShariahPreference {
  if (pref === "unrestricted" || pref === "shariah_purifying") return "unrestricted";
  return "fully_shariah";
}

export function allowedGroups(pref: string | ShariahPreference): ShariahStatus[] {
  if (normalizePreference(pref) === "fully_shariah") return ["shariah"];
  return ["shariah", "not_shariah"];
}

export function universeLabel(pref: string | ShariahPreference): string {
  return normalizePreference(pref) === "fully_shariah" ? "Shariah only" : "Shariah and Not Shariah";
}

export function modelCodeFor(pref: ShariahPreference, risk: RiskProfile) {
  return MODEL_CODE[`${normalizePreference(pref)}:${risk}`];
}

export function benchmarkNameFor(pref: ShariahPreference): "QERI" | "DSM" {
  return normalizePreference(pref) === "unrestricted" ? "DSM" : "QERI";
}
