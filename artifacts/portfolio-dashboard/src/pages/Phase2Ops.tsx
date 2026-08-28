import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import {
  listReportReleases, createReportRelease, releaseReport,
  listReconciliationRuns, runReconciliation, resolveReconciliation,
  listOpsForms, createOpsForm, approveOpsForm,
} from "@/lib/api";
import { PrintButton } from "@/components/phase1/PrintButton";

export default function ReportsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["report-releases"], queryFn: listReportReleases });
  const reportRows = data?.data ?? [];
  const paging = useClientTablePage(reportRows, String(reportRows.length));
  const [kind, setKind] = useState("aum_monthly");
  const [periodLabel, setPeriodLabel] = useState(() => new Date().toISOString().slice(0, 7));
  const create = useMutation({
    mutationFn: () => createReportRelease({ kind, periodLabel }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-releases"] }),
  });
  const release = useMutation({
    mutationFn: (id: string) => releaseReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["report-releases"] }),
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase2.reportsTitle")}
        description={t("phase2.reportsDesc")}
      />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <SelectField
          value={kind}
          onValueChange={setKind}
          options={[
            { value: "client_monthly", label: t("phase2.kindClientMonthly") },
            { value: "aum_monthly", label: t("phase2.kindAumMonthly") },
            { value: "ic_quarterly", label: t("phase2.kindIcQuarterly") },
          ]}
        />
        <Input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="2026-08" className="max-w-[10rem]" />
        <Button onClick={() => create.mutate()} disabled={create.isPending}>{t("phase2.createPack")}</Button>
        {create.isError && <p className="w-full text-sm text-loss">{(create.error as Error).message}</p>}
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase2.colKind")}</TableHead>
              <TableHead>{t("phase2.colPeriod")}</TableHead>
              <TableHead>{t("phase2.colStatus")}</TableHead>
              <TableHead className="text-end">{t("phase2.colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reportRows.length === 0 ? (
              <TableRow><TableCell colSpan={4}><EmptyState title={t("phase2.emptyReportsTitle")} description={t("phase2.emptyReportsDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.kind}</TableCell>
                <TableCell className="font-data">{r.periodLabel}</TableCell>
                <TableCell><Badge variant={r.status === "blocked" ? "destructive" : "default"}>{r.status}</Badge></TableCell>
                <TableCell className="space-x-2 rtl:space-x-reverse text-end">
                  <PrintButton
                    title={`${r.kind} ${r.periodLabel}`}
                    label={t("common.print")}
                    size="sm"
                    buildHtml={() => {
                      const payload = (r.payload || {}) as Record<string, any>;
                      const dash = payload.dashboard || {};
                      const holdings = payload.holdings || [];
                      const holdRows = holdings.slice(0, 80).map((h: any) =>
                        `<tr><td>${h.ticker || h.stockId || ""}</td><td class="num">${Number(h.quantity ?? 0).toLocaleString()}</td><td class="num">${Number(h.currentValue ?? 0).toFixed(2)}</td></tr>`
                      ).join("");
                      const kindLabel = r.kind.replaceAll("_", " ");
                      return `<h1>${t("phase2.printHeading", { kind: kindLabel })}</h1>
<p class="meta">${t("phase2.printMeta", { period: r.periodLabel, status: r.status, printed: new Date().toLocaleString() })}</p>
<h2>${t("phase2.printSummary")}</h2>
<table><tbody>
<tr><th>${t("phase2.printTotalAum")}</th><td class="num">${dash.totalAum ?? dash.aum ?? "—"}</td></tr>
<tr><th>${t("phase2.printPortfolios")}</th><td class="num">${dash.portfolioCount ?? "—"}</td></tr>
<tr><th>${t("phase2.printPayloadKeys")}</th><td>${Object.keys(payload).join(", ") || "—"}</td></tr>
</tbody></table>
${holdings.length ? `<h2>${t("phase2.printHoldingsSample")}</h2><table><thead><tr><th>${t("common.ticker")}</th><th>${t("common.qty")}</th><th>${t("common.value")}</th></tr></thead><tbody>${holdRows}</tbody></table>` : `<p class="muted">${t("phase2.printNoHoldings")}</p>`}`;
                    }}
                  />
                  {(r.status === "draft" || r.status === "pending_recon") && (
                    <Button size="sm" onClick={() => release.mutate(r.id)}>{t("phase2.release")}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function ReconciliationPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["recon-runs"], queryFn: listReconciliationRuns });
  const reconRows = data?.data ?? [];
  const paging = useClientTablePage(reconRows, String(reconRows.length));
  const run = useMutation({
    mutationFn: () => runReconciliation({ asOf: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recon-runs"] }),
  });
  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "cleared" | "explained" }) =>
      resolveReconciliation(id, { status, explanation: status === "explained" ? "Approved explanation" : undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recon-runs"] }),
  });

  return (
    <Shell>
      <PageHeader title={t("phase2.reconTitle")} description={t("phase2.reconDesc")} />
      <Button className="mb-4" onClick={() => run.mutate()} disabled={run.isPending}>{t("phase2.runReconciliation")}</Button>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase2.colAsOf")}</TableHead>
              <TableHead>{t("phase2.colStatus")}</TableHead>
              <TableHead>{t("phase2.colHoldingsFlags")}</TableHead>
              <TableHead className="text-end">{t("phase2.colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reconRows.length === 0 ? (
              <TableRow><TableCell colSpan={4}><EmptyState title={t("phase2.emptyRunsTitle")} description={t("phase2.emptyRunsDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-data">{r.asOf}</TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell className="font-data">{r.holdingsDiffCount}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  {r.status === "open" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: r.id, status: "explained" })}>{t("phase2.explain")}</Button>
                      <Button size="sm" onClick={() => resolve.mutate({ id: r.id, status: "cleared" })}>{t("common.clear")}</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function OpsFormsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["ops-forms"], queryFn: listOpsForms });
  const formRows = data?.data ?? [];
  const paging = useClientTablePage(formRows, String(formRows.length));
  const [formCode, setFormCode] = useState("F-01");
  const create = useMutation({
    mutationFn: () => createOpsForm({ formCode, payload: { note: "Created from Ops Forms UI" } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-forms"] }),
  });
  const approve = useMutation({
    mutationFn: (id: string) => approveOpsForm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ops-forms"] }),
  });

  return (
    <Shell>
      <PageHeader
        title={t("phase2.opsTitle")}
        description={t("phase2.opsDesc")}
      />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <SelectField
          value={formCode}
          onValueChange={setFormCode}
          options={(data?.formCodes ?? ["F-01", "F-02", "F-03", "F-04", "F-05", "F-06"]).map((c) => ({ value: c, label: c }))}
        />
        <Button onClick={() => create.mutate()}>{t("phase2.createEvent")}</Button>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase2.colForm")}</TableHead>
              <TableHead>{t("phase2.colStatus")}</TableHead>
              <TableHead>{t("common.created")}</TableHead>
              <TableHead className="text-end">{t("phase2.colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formRows.length === 0 ? (
              <TableRow><TableCell colSpan={4}><EmptyState title={t("phase2.emptyFormsTitle")} description={t("phase2.emptyFormsDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono">{e.formCode}</TableCell>
                <TableCell><Badge>{e.status}</Badge></TableCell>
                <TableCell className="font-data text-xs">{e.createdAt?.slice(0, 19)}</TableCell>
                <TableCell className="text-end">
                  {e.status === "draft" && (
                    <Button size="sm" onClick={() => approve.mutate(e.id)}>{t("common.approve")}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}
