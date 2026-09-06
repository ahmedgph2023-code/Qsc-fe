import { useTranslation } from "react-i18next";
import { Inbox, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatementPreview, formatQar } from "@/components/statements/StatementPreview";
import type { ClientReportPayload, ClientReportSection } from "@/lib/api";
import type { ClientStatement } from "@/lib/statement-types";
import { cn } from "@/lib/utils";

function isStatement(value: unknown): value is ClientStatement {
  return Boolean(value && typeof value === "object" && "kind" in (value as object));
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#dce5f2] bg-[#f8faff] px-4 py-10 text-center">
      <Inbox className="size-8 text-[#9aa6ba]" />
      <p className="text-sm text-[#657491]">{message}</p>
    </div>
  );
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string; tone?: string }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[14px] border border-[#e1e7f0] bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8a97b0]">{item.label}</p>
          <p className={cn("mt-1 text-lg font-bold text-[#17356d]", item.tone)}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function BalanceSection({ value }: { value: unknown }) {
  const { t } = useTranslation();
  if (value == null) {
    return <EmptySection message={t("clientReports.previewEmptyBalance")} />;
  }
  const row = value as Record<string, unknown>;
  const items = [
    { label: t("clientReports.previewFields.clientId"), value: String(row.clientId ?? "—") },
    { label: t("clientReports.previewFields.name"), value: String(row.name ?? row.clientName ?? "—") },
    {
      label: t("clientReports.previewFields.cash"),
      value: formatQar(typeof row.cashBalance === "number" ? row.cashBalance : Number(row.cashBalance)),
    },
    {
      label: t("clientReports.previewFields.nav"),
      value: formatQar(typeof row.navValue === "number" ? row.navValue : Number(row.navValue ?? row.portfolioValue)),
    },
    {
      label: t("clientReports.previewFields.status"),
      value: String(row.status ?? row.matchStatus ?? "—"),
    },
  ];
  return <MetricGrid items={items} />;
}

function PerformanceSection({ value }: { value: unknown }) {
  const { t } = useTranslation();
  if (value == null || typeof value !== "object") {
    return <EmptySection message={t("clientReports.previewEmptyPerformance")} />;
  }
  const row = value as Record<string, unknown>;
  const num = (k: string) => (typeof row[k] === "number" ? (row[k] as number) : Number(row[k]));
  return (
    <MetricGrid
      items={[
        { label: t("clientReports.previewFields.asOf"), value: String(row.asOf ?? "—") },
        { label: t("clientReports.previewFields.nav"), value: formatQar(num("nav")) },
        { label: t("clientReports.previewFields.marketValue"), value: formatQar(num("marketValue")) },
        { label: t("clientReports.previewFields.cost"), value: formatQar(num("cost")) },
        { label: t("clientReports.previewFields.cash"), value: formatQar(num("cash")) },
        {
          label: t("clientReports.previewFields.netPl"),
          value: formatQar(num("netPl")),
          tone: num("netPl") > 0 ? "text-[#159957]" : num("netPl") < 0 ? "text-[#e04444]" : undefined,
        },
      ]}
    />
  );
}

function TransactionsSection({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const lines = Array.isArray(value) ? value : [];
  if (!lines.length) return <EmptySection message={t("clientReports.previewEmptyTransactions")} />;
  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#e1e7f0]">
      <table className="w-max min-w-full text-left text-[12px]">
        <thead className="bg-[#f8faff] text-[10px] font-bold uppercase tracking-[0.05em] text-[#657491]">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5">{t("clientReports.previewFields.date")}</th>
            <th className="whitespace-nowrap px-3 py-2.5">{t("clientReports.previewFields.type")}</th>
            <th className="whitespace-nowrap px-3 py-2.5">{t("clientReports.previewFields.desc")}</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-end">{t("clientReports.previewFields.debit")}</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-end">{t("clientReports.previewFields.credit")}</th>
            <th className="whitespace-nowrap px-3 py-2.5 text-end">{t("clientReports.previewFields.balance")}</th>
          </tr>
        </thead>
        <tbody>
          {lines.slice(0, 50).map((line, idx) => {
            const l = line as Record<string, unknown>;
            return (
              <tr key={idx} className="border-t border-[#eef2f8]">
                <td className="whitespace-nowrap px-3 py-2 text-[#17356d]">{String(l.postDate ?? l.date ?? "—")}</td>
                <td className="whitespace-nowrap px-3 py-2 text-[#657491]">{String(l.transType ?? l.type ?? "—")}</td>
                <td className="max-w-[22rem] truncate px-3 py-2 text-[#17356d]">{String(l.description ?? l.remarks ?? "—")}</td>
                <td className="whitespace-nowrap px-3 py-2 text-end font-mono">{formatQar(Number(l.debit))}</td>
                <td className="whitespace-nowrap px-3 py-2 text-end font-mono">{formatQar(Number(l.credit))}</td>
                <td className="whitespace-nowrap px-3 py-2 text-end font-mono font-semibold text-[#17356d]">
                  {formatQar(Number(l.balance))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {lines.length > 50 ? (
        <p className="border-t border-[#eef2f8] px-3 py-2 text-xs text-[#8a97b0]">
          {t("clientReports.previewTruncated", { shown: 50, total: lines.length })}
        </p>
      ) : null}
    </div>
  );
}

function SectionBody({ section, value }: { section: ClientReportSection; value: unknown }) {
  if (
    section === "portfolio_statement"
    || section === "account_statement"
    || section === "realized_summary"
    || section === "realized_details"
  ) {
    if (!isStatement(value)) {
      return <EmptySection message={`No ${section.replaceAll("_", " ")} data for this client.`} />;
    }
    return (
      <div className="overflow-x-auto rounded-[14px] border border-[#e1e7f0] bg-white p-2 sm:p-3">
        <StatementPreview stmt={value} />
      </div>
    );
  }
  if (section === "balance_snapshot") return <BalanceSection value={value} />;
  if (section === "performance") return <PerformanceSection value={value} />;
  if (section === "transactions") return <TransactionsSection value={value} />;
  return (
    <pre className="max-h-72 overflow-auto rounded-[14px] border border-[#e1e7f0] bg-[#f8faff] p-3 text-[11px] text-[#17356d]">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function ClientReportPreview({ payload }: { payload: ClientReportPayload }) {
  const { t } = useTranslation();
  const entries = Object.entries(payload.sections) as Array<[ClientReportSection, unknown]>;

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-[#dce5f2] bg-[linear-gradient(135deg,#f8faff_0%,#eef4ff_100%)] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a97b0]">
              {t("clientReports.preview")}
            </p>
            <h3 className="text-lg font-bold text-[#17356d]">{payload.client.name}</h3>
            <p className="text-sm text-[#657491]">
              {t("clientReports.previewMeta", {
                client: payload.client.name,
                asOf: payload.asOf,
                from: payload.from,
                to: payload.to,
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Mail className="size-3" />
              {payload.client.email || t("clientReports.contact.noEmail")}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Phone className="size-3" />
              {payload.client.phone || t("clientReports.contact.noPhone")}
            </Badge>
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptySection message={t("clientReports.previewEmptySections")} />
      ) : (
        entries.map(([key, value]) => (
          <section key={key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-(--shell-blue)" />
              <h4 className="text-sm font-bold text-[#17356d]">
                {payload.sectionLabels[key] ?? t(`clientReports.sections.${key}`)}
              </h4>
            </div>
            <SectionBody section={key} value={value} />
          </section>
        ))
      )}
    </div>
  );
}
