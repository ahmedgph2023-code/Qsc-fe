import { useTranslation } from "react-i18next";
import type { StatementDateControl, StatementInvestorHeader } from "@/lib/statement-types";
import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  dir,
  className,
}: {
  label: string;
  value: string | null | undefined;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#8a97b0]">{label}</dt>
      <dd className="mt-0.5 truncate text-[13px] font-semibold text-[#17356d]" dir={dir}>
        {value}
      </dd>
    </div>
  );
}

function periodLabel(dates: StatementDateControl, t: (key: string, opts?: Record<string, string>) => string) {
  if (dates.mode === "as_of") return t("statements.asOf") + ": " + dates.asOf;
  return `${dates.from} → ${dates.to}`;
}

export function StatementInvestorHeaderCard({
  investor,
  dates,
  className,
}: {
  investor: StatementInvestorHeader;
  dates?: StatementDateControl;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const name =
    (i18n.language.startsWith("ar") ? investor.nameAr || investor.nameEn : investor.nameEn || investor.nameAr)
    || investor.displayName;

  return (
    <section
      className={cn(
        "rounded-[14px] border border-[#e1e7f0] bg-[#f8faff] px-4 py-4 sm:px-5 dark:border-white/10 dark:bg-[var(--color-surface-elevated)]",
        className,
      )}
      aria-label={t("statements.investorHeaderAria")}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e1e7f0] pb-3 dark:border-white/10">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-[#0b1f4a]">{name}</h2>
          <p className="mt-0.5 text-xs text-[#657491]">
            <bdi dir="ltr" className="tabular-nums">{investor.nin}</bdi>
            {" · "}
            {t("customers2.account")}{" "}
            <bdi dir="ltr" className="tabular-nums font-semibold text-[#175cd3]">{investor.accountId}</bdi>
            {investor.clientCode ? (
              <>
                {" · "}
                {t("customers2.clientCode")}{" "}
                <bdi dir="ltr" className="tabular-nums">{investor.clientCode}</bdi>
              </>
            ) : null}
          </p>
        </div>
        {dates ? (
          <p className="text-xs font-semibold text-[#657491]">{periodLabel(dates, t)}</p>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <Field label={t("statements.investor.cAccount")} value={investor.cAccount} dir="ltr" />
        <Field label={t("statements.investor.clientType")} value={investor.clientType} dir="ltr" />
        <Field label={t("statements.investor.accountType")} value={investor.accountTypePrinted} />
        <Field label={t("statements.investor.tradingAccount")} value={investor.tradingAccountQe} dir="ltr" />
        <Field label={t("statements.investor.email")} value={investor.email} dir="ltr" />
        <Field label={t("statements.investor.mobile")} value={investor.mobile} dir="ltr" />
        <Field label={t("statements.investor.poBox")} value={investor.poBox} dir="ltr" />
        <Field label={t("statements.investor.tel")} value={investor.tel} dir="ltr" />
        <Field label={t("statements.investor.fax")} value={investor.fax} dir="ltr" />
        <Field label={t("statements.investor.city")} value={investor.city} />
        <Field label={t("statements.investor.country")} value={investor.country} />
        <Field label={t("statements.investor.currency")} value={investor.currency} dir="ltr" />
        <Field label={t("statements.investor.address")} value={investor.address} className="col-span-2 sm:col-span-3 lg:col-span-4" />
      </dl>
    </section>
  );
}
