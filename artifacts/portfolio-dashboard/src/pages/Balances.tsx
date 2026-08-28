import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import { getSnapshots, runSnapshots, getBalanceQuestions, type SnapshotCompareRow, type SnapshotMatchStatus } from "@/lib/api";
import { formatQar } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });

function readAsOfFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return q.get("asOf") || todayQatarIso();
}

function readClientFromUrl() {
  return new URLSearchParams(window.location.search).get("client") || "";
}

function MatchCell({ ok, className }: { ok: boolean | null; className?: string }) {
  const { t } = useTranslation();
  if (ok == null) return <span className={cn("text-muted-foreground", className)}>{t("common.na")}</span>;
  return (
    <span className={cn("font-mono text-[11px] uppercase", ok ? "text-[var(--color-positive)]" : "text-loss", className)}>
      {ok ? t("balances.match") : t("balances.diff")}
    </span>
  );
}

function Money({ value }: { value: number | null | undefined }) {
  return (
    <bdi dir="ltr" className="font-data tabular-nums">
      {formatQar(value)}
    </bdi>
  );
}

function statusClass(status: SnapshotMatchStatus) {
  if (status === "matched") return "text-[var(--color-positive)]";
  if (status === "cash_only") return "text-muted-foreground";
  if (status === "mismatch") return "text-loss";
  return "text-muted-foreground";
}

export default function Balances() {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canRun = canPerformAction("snapshot.run", { role, username });
  const client = useQueryClient();
  const [asOf, setAsOf] = useState(readAsOfFromUrl);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const clientFilter = readClientFromUrl();

  const { data, isLoading } = useQuery({
    queryKey: ["snapshots", asOf],
    queryFn: () => getSnapshots(asOf),
  });
  const { data: openQs } = useQuery({
    queryKey: ["balance-questions"],
    queryFn: getBalanceQuestions,
  });

  const runMut = useMutation({
    mutationFn: () => runSnapshots(asOf),
    onSuccess: () => {
      setError("");
      client.invalidateQueries({ queryKey: ["snapshots", asOf] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const rows = useMemo(() => {
    let list = data?.rows ?? [];
    if (clientFilter) {
      const id = Number(clientFilter);
      list = list.filter((r) => r.clientId === id || String(r.clientId) === clientFilter);
    }
    if (!status) return list;
    return list.filter((r) => r.status === status);
  }, [data?.rows, status, clientFilter]);
  const paging = useClientTablePage(rows, `${asOf}|${status}|${clientFilter}`);

  const summary = data?.summary;
  const qscDates = data?.qscDates ?? [];
  const storedDates = data?.storedDates ?? [];

  useEffect(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("asOf", asOf);
    if (clientFilter) u.searchParams.set("client", clientFilter);
    else u.searchParams.delete("client");
    window.history.replaceState(null, "", `${u.pathname}${u.search}`);
  }, [asOf, clientFilter]);

  return (
    <Shell>
      <PageHeader
        title={t("balances.title")}
        description={t("balances.description")}
        actions={
          canRun ? (
            <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
              <Scale className="me-2 h-4 w-4" />
              {runMut.isPending ? t("common.loading") : t("balances.run")}
            </Button>
          ) : null
        }
      />

      {error && <p className="error-banner">{error}</p>}
      {data?.maxOfficialCloseDate && asOf > data.maxOfficialCloseDate ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("balances.closesLag", { asOf, closeDate: data.maxOfficialCloseDate })}
        </p>
      ) : null}

      <FilterBar>
        <DatePicker value={asOf} onChange={setAsOf} prefix={t("balances.asOf")} />
        <SelectField
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "", label: t("balances.allStatus") },
            { value: "matched", label: t("balances.status.matched") },
            { value: "cash_only", label: t("balances.status.cash_only") },
            { value: "mismatch", label: t("balances.status.mismatch") },
            { value: "incomplete", label: t("balances.status.incomplete") },
            { value: "qsc_missing", label: t("balances.status.qsc_missing") },
          ]}
        />
        {qscDates.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("balances.qscDates")}</span>
            {qscDates.map((d) => {
              const stored = storedDates.includes(d.date);
              return (
                <Button
                  key={d.date}
                  type="button"
                  size="sm"
                  variant={d.date === asOf ? "default" : "outline"}
                  onClick={() => setAsOf(d.date)}
                >
                  {d.date}
                  <span className="ms-1 font-mono text-[10px] opacity-80">
                    {d.rows}
                    {stored ? ` · ${t("balances.inIpms")}` : ""}
                  </span>
                </Button>
              );
            })}
          </div>
        ) : data?.latestQscDate ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("balances.latestQsc", { date: data.latestQscDate })}
            </p>
            {data.latestQscDate !== asOf ? (
              <Button type="button" variant="outline" onClick={() => setAsOf(data.latestQscDate!)}>
                {t("balances.useLatestQsc")}
              </Button>
            ) : null}
          </>
        ) : null}
      </FilterBar>

      {summary ? (
        <StatsSummaryBar
          className="mb-6"
          ariaLabel={t("balances.title")}
          items={[
            { id: "total", icon: "/info.png", label: t("balances.kpiTotal"), value: summary.total, hint: "" },
            { id: "matched", icon: "/security.png", label: t("balances.status.matched"), value: summary.matched, hint: "", valueClassName: "text-[var(--color-positive)]" },
            { id: "cash_only", icon: "/info.png", label: t("balances.status.cash_only"), value: summary.cash_only ?? 0, hint: "" },
            { id: "mismatch", icon: "/calendar.png", label: t("balances.status.mismatch"), value: summary.mismatch, hint: "", valueClassName: "text-loss" },
            { id: "incomplete", icon: "/info.png", label: t("balances.status.incomplete"), value: summary.incomplete, hint: "" },
          ]}
        />
      ) : null}

      {isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <EmptyState title={t("balances.emptyTitle")} description={t("balances.emptyDesc")} />
      ) : (
        <AppTable
          footer={
            <TablePageFooter
              total={paging.total}
              page={paging.page}
              pageSize={paging.pageSize}
              pageSizes={paging.pageSizes}
              loading={isLoading}
              onPageChange={paging.setPage}
              onPageSizeChange={paging.setPageSize}
            />
          }
        >
            <TableHeader>
              <TableRow>
                <TableHead>{t("balances.col.client")}</TableHead>
                <TableHead className="text-end">{t("balances.col.qscPv")}</TableHead>
                <TableHead className="text-end">{t("balances.col.ipmsMv")}</TableHead>
                <TableHead className="text-end">{t("balances.col.ipmsNav")}</TableHead>
                <TableHead>{t("balances.col.pvVsMv")}</TableHead>
                <TableHead>{t("balances.col.pvVsNav")}</TableHead>
                <TableHead className="text-end">{t("balances.col.qscCash")}</TableHead>
                <TableHead className="text-end">{t("balances.col.ipmsCash")}</TableHead>
                <TableHead>{t("balances.col.cash")}</TableHead>
                <TableHead className="text-end">{t("balances.col.bank")}</TableHead>
                <TableHead>{t("balances.col.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paging.paged.map((row: SnapshotCompareRow) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link href={`/customers/${row.clientId}`} className="font-medium hover:underline">
                      {row.name || row.clientId}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground">{row.clientId}{row.nin ? ` · ${row.nin}` : ""}</div>
                  </TableCell>
                  <TableCell className="text-end"><Money value={row.qscPortfolioValue} /></TableCell>
                  <TableCell className="text-end"><Money value={row.ipmsMarketValue} /></TableCell>
                  <TableCell className="text-end"><Money value={row.ipmsNavMvPlusCash} /></TableCell>
                  <TableCell><MatchCell ok={row.mvMatch} /></TableCell>
                  <TableCell><MatchCell ok={row.navMatch} /></TableCell>
                  <TableCell className="text-end"><Money value={row.qscSystemCash} /></TableCell>
                  <TableCell className="text-end"><Money value={row.ipmsCash} /></TableCell>
                  <TableCell><MatchCell ok={row.cashMatch} /></TableCell>
                  <TableCell className="text-end">
                    <Money value={row.qscBankBalance} />
                    <div className="text-[10px] text-muted-foreground">{t("balances.bankUnknown")}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-mono text-[11px] uppercase", statusClass(row.status))}>
                      {t(`balances.status.${row.status}`)}
                    </span>
                    {row.missingCloses.length > 0 ? (
                      <div className="max-w-[12rem] truncate text-[10px] text-muted-foreground" title={row.missingCloses.join(", ")}>
                        {t("balances.missingCloses", { tickers: row.missingCloses.join(", ") })}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </AppTable>
      )}

      <p className="mt-8 text-sm text-muted-foreground">{t("balances.openQuestionsHint")}</p>
      <BlockedBoardTable rows={openQs?.rows ?? []} askPrefix="balances.ask" />
    </Shell>
  );
}
