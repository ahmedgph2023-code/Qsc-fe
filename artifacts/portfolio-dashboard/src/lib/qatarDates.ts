import { formatYmd, parseYmd } from "@/components/phase1/DatePicker";

export const QATAR_TZ = "Asia/Qatar";

export function todayQatarIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: QATAR_TZ });
}

export function tomorrowQatarIso(): string {
  const today = parseYmd(todayQatarIso());
  if (!today) return todayQatarIso();
  today.setDate(today.getDate() + 1);
  return formatYmd(today);
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseYmd(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return formatYmd(date);
}
