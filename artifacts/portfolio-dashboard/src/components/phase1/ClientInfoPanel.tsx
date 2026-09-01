import { useTranslation } from "react-i18next";
import { UserCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { SourceHint } from "@/components/phase1/SourceHint";
import type { ExtClientDetail } from "@/lib/api";
import { extClientDisplayName } from "@/lib/api";
import { cn } from "@/lib/utils";

type InfoRow = {
  id: string;
  label: string;
  value: string | null | undefined;
  dir?: "ltr" | "rtl";
  hint?: string;
};

function InfoTable({
  title,
  hint,
  rows,
  fieldLabel,
  valueLabel,
}: {
  title: string;
  hint?: string;
  rows: InfoRow[];
  fieldLabel: string;
  valueLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e1e7f0] bg-white dark:border-white/10 dark:bg-[var(--color-surface-elevated)]">
      <div className="border-b border-[#e1e7f0] px-4 py-3 dark:border-white/10">
        <h3 className="text-sm font-bold text-[#0b1f4a]">{title}</h3>
        {hint ? <p className="mt-0.5 text-xs text-[#657491]">{hint}</p> : null}
      </div>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="clients-thead-row h-10 hover:bg-transparent">
            <TableCell className="w-[38%] px-4 text-[10px] font-bold uppercase tracking-wide text-[#8a97b0]">
              {fieldLabel}
            </TableCell>
            <TableCell className="px-4 text-[10px] font-bold uppercase tracking-wide text-[#8a97b0]">
              {valueLabel}
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="clients-row h-11">
              <TableCell className="px-4 align-middle text-sm font-medium text-[#657491]">
                <span className="inline-flex items-center gap-1.5">
                  {row.label}
                  {row.hint ? <SourceHint text={row.hint} /> : null}
                </span>
              </TableCell>
              <TableCell
                className={cn(
                  "px-4 align-middle text-sm font-semibold text-[#17356d]",
                  !row.value && "text-[#9aa6ba] font-normal",
                )}
                dir={row.dir}
              >
                {row.value?.trim() ? row.value : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

export function ClientInfoPanel({ data }: { data: ExtClientDetail }) {
  const { t, i18n } = useTranslation();
  const displayName = extClientDisplayName(data, i18n.language);
  const fieldLabel = t("customers2.infoField");
  const valueLabel = t("customers2.infoValue");

  const identityRows: InfoRow[] = [
    { id: "displayName", label: t("customerDetail.fullName"), value: displayName },
    { id: "nameEn", label: t("customers2.nameEn"), value: data.nameEn },
    { id: "nameAr", label: t("customers2.nameAr"), value: data.nameAr, dir: "rtl" },
    { id: "nin", label: t("customers2.nin"), value: data.nin, dir: "ltr" },
    { id: "account", label: t("customers2.account"), value: data.accountNumber, dir: "ltr" },
    { id: "clientCode", label: t("customers2.clientCode"), value: data.mainObjCode, dir: "ltr" },
    { id: "cAccount", label: t("statements.investor.cAccount"), value: data.cAccount, dir: "ltr" },
    { id: "clientType", label: t("statements.investor.clientType"), value: data.clientType, dir: "ltr" },
  ];

  const contactRows: InfoRow[] = [
    { id: "email", label: t("statements.investor.email"), value: data.email, dir: "ltr" },
    { id: "mobile", label: t("statements.investor.mobile"), value: data.mobile, dir: "ltr" },
    { id: "fax", label: t("statements.investor.fax"), value: data.fax, dir: "ltr" },
    { id: "poBox", label: t("statements.investor.poBox"), value: data.poBox, dir: "ltr" },
    { id: "city", label: t("statements.investor.city"), value: data.city },
    { id: "address", label: t("statements.investor.address"), value: data.address },
  ];

  const portfolioRows: InfoRow[] = [
    { id: "asOf", label: t("historicalPortfolio.dateLabel"), value: data.asOf, dir: "ltr" },
    {
      id: "nav",
      label: t("statements.footer.nav"),
      value: formatCurrency(data.navValue),
      dir: "ltr",
    },
    {
      id: "equity",
      label: t("customers2.equityMv"),
      value: formatCurrency(data.equityMv),
      dir: "ltr",
    },
    {
      id: "cash",
      label: t("customers.cash"),
      value: formatCurrency(data.cashBalance),
      dir: "ltr",
    },
    {
      id: "invested",
      label: t("customers2.totalInvested"),
      value: formatCurrency(data.totalInvested),
      dir: "ltr",
    },
    {
      id: "unrealized",
      label: t("customers2.unrealizedPnL"),
      value: formatCurrency(data.unrealizedPnL),
      dir: "ltr",
    },
    {
      id: "realized",
      label: t("customers2.realizedPnL"),
      value: formatCurrency(data.realizedPnL),
      dir: "ltr",
    },
    {
      id: "return",
      label: t("customers2.returnPct"),
      value: data.returnPct == null ? null : `${data.returnPct.toFixed(2)}%`,
      dir: "ltr",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#657491]">
        <UserCircle2 className="size-4 shrink-0 text-[#175cd3]" strokeWidth={1.75} />
        <span>{t("customers2.contactHint")}</span>
      </div>
      <InfoTable
        title={t("customers2.infoSectionIdentity")}
        rows={identityRows}
        fieldLabel={fieldLabel}
        valueLabel={valueLabel}
      />
      <InfoTable
        title={t("customers2.infoSectionContact")}
        hint={t("customers2.infoSectionContactHint")}
        rows={contactRows}
        fieldLabel={fieldLabel}
        valueLabel={valueLabel}
      />
      <InfoTable
        title={t("customers2.infoSectionPortfolio")}
        hint={t("customers2.infoSectionPortfolioHint", { asOf: data.asOf })}
        rows={portfolioRows}
        fieldLabel={fieldLabel}
        valueLabel={valueLabel}
      />
    </div>
  );
}
