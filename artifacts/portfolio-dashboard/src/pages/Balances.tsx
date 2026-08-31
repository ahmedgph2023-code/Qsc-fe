import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Inbox, Scale } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { DatePicker } from "@/components/phase1/DatePicker";
import { SelectField } from "@/components/phase1/SelectField";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { StatsSummaryBar, type StatsSummaryItem } from "@/components/phase1/StatsSummaryBar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { BlockedBoardTable } from "@/components/phase1/BlockedBoardTable";
import { getSnapshots, runSnapshots, getBalanceQuestions, type SnapshotCompareRow, type SnapshotMatchStatus } from "@/lib/api";
import { formatQar } from "@/components/statements/StatementPreview";
import { cn } from "@/lib/utils";

const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });

const thClass =
  "h-[52px] bg-[#f8faff] px-3.5 text-[10px] font-bold tracking-[0.6px] text-[#657491] first:text-center";
const cellPy = { paddingTop: 8, paddingBottom: 8 } as const;
const TABLE_WRAP = "clients-table-wrap overflow-x-auto";

function readAsOfFromUrl() {
  const q = new URLSearchParams(window.location.search);
  return q.get("asOf") || todayQatarIso();
}

function readClientFromUrl() {
  return new URLSearchParams(window.location.search).get("client") || "";
}

function Money({ value }: { value: number | null | undefined }) {
  return (
    <bdi dir="ltr" className="font-data tabular-nums">
      {formatQar(value)}
    </bdi>
  );
}

function MatchChip({ ok }: { ok: boolean | null }) {
  const { t } = useTranslation();
  if (ok == null) {
    return <span className="text-[11px] font-medium text-[#9aa6ba]">{t("common.na")}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-12 items-center justify-center rounded-md px-2 text-[11px] font-bold",
        ok ? "bg-[#eef8f2] text-[#159957]" : "bg-[#fff0ee] text-[#e04444]",
      )}
    >
      {ok ? t("balances.match") : t("balances.diff")}
    </span>
  );
}

function statusChipClass(status: SnapshotMatchStatus) {
  if (status === "matched") return "bg-[#eef8f2] text-[#159957]";
  if (status === "mismatch") return "bg-[#fff0ee] text-[#e04444]";
  if (status === "cash_only") return "bg-[#eef4ff] text-[#175cd3]";
  if (status === "incomplete") return "bg-[#fff8e8] text-[#9a6b00]";
  return "bg-[#f4f7fd] text-[#657491]";
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

  const { data, isLoading, isError, error: loadError } = useQuery({
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
  const paging = useClientTablePage(rows, `${asOf}|${status}|${clientFilter}|${rows.length}`);

  const summary = data?.summary;
  const qscDates = data?.qscDates ?? [];
  const storedDates = data?.storedDates ?? [];
  const kpiHint = t("balances.kpiHint");
  const kpiItems: StatsSummaryItem[] = [
    {
      id: "total",
      icon: "/user.png",
      label: t("balances.kpiTotal"),
      value: <AnimatedNumber value={summary?.total ?? 0} format="integer" />,
      hint: kpiHint,
    },
    {
      id: "matched",
      icon: "/security.png",
      label: t("balances.status.matched"),
      value: <AnimatedNumber value={summary?.matched ?? 0} format="integer" />,
      hint: kpiHint,
      valueClassName: "text-[#159957]",
    },
    {
      id: "cash_only",
      icon: "/Cash-2.png",
      label: t("balances.status.cash_only"),
      value: <AnimatedNumber value={summary?.cash_only ?? 0} format="integer" />,
      hint: kpiHint,
    },
    {
      id: "mismatch",
      icon: "/Unrealized P&L.png",
      label: t("balances.status.mismatch"),
      value: <AnimatedNumber value={summary?.mismatch ?? 0} format="integer" />,
      hint: kpiHint,
      valueClassName: "text-[#e04444]",
    },
    {
      id: "incomplete",
      icon: "/info.png",
      label: t("balances.status.incomplete"),
      value: <AnimatedNumber value={summary?.incomplete ?? 0} format="integer" />,
      hint: kpiHint,
    },
  ];

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
        className="!mt-4"
        title={t("balances.title")}
        description={t("balances.description")}
        actions={
          canRun ? (
            <Button onClick={() => runMut.mutate()} disabled={runMut.isPending}>
              <Scale />
              {runMut.isPending ? t("common.loading") : t("balances.run")}
            </Button>
          ) : null
        }
      />

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="clients-table-card overflow-hidden">
        <DataTableToolbar
          className="flex-wrap"
          icon="/Holdings + cash.png"
          count={t("balances.toolbarCount", { date: asOf, count: rows.length })}
          countLoading={isLoading}
          actions={
            <>
              <DatePicker
                className="min-w-44 w-auto"
                prefix={t("balances.asOf")}
                value={asOf}
                onChange={(iso) => setAsOf(iso || todayQatarIso())}
              />
              <SelectField
                className="h-9 w-[150px] min-w-[150px] max-w-[150px] shrink-0"
                contentClassName="clients-select-content min-w-[14rem]"
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
                aria-label={t("balances.col.status")}
              />
              {qscDates.map((d) => {
                const stored = storedDates.includes(d.date);
                const active = d.date === asOf;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setAsOf(d.date)}
                    className={cn(
                      "inline-flex h-9 items-center rounded-md px-2.5 text-[11px] font-bold",
                      active ? "bg-[#175cd3] text-white" : "bg-[#eef4ff] text-[#175cd3] hover:bg-[#dce8ff]",
                    )}
                  >
                    {d.date}
                    <span className={cn("ms-1 font-mono text-[10px]", active ? "opacity-80" : "opacity-70")}>
                      {d.rows}
                      {stored ? ` · ${t("balances.inIpms")}` : ""}
                    </span>
                  </button>
                );
              })}
              {!qscDates.length && data?.latestQscDate && data.latestQscDate !== asOf ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setAsOf(data.latestQscDate!)}>
                  {t("balances.useLatestQsc")}
                </Button>
              ) : null}
            </>
          }
        />

        <div className="p-4 sm:p-5">
          {data?.maxOfficialCloseDate && asOf > data.maxOfficialCloseDate ? (
            <p className="mb-4 text-sm text-[#657491]">
              {t("balances.closesLag", { asOf, closeDate: data.maxOfficialCloseDate })}
            </p>
          ) : null}
          {!qscDates.length && data?.latestQscDate ? (
            <p className="mb-4 text-sm text-[#657491]">{t("balances.latestQsc", { date: data.latestQscDate })}</p>
          ) : null}

          <div className="mb-5 space-y-3">
            <StatsSummaryBar
              ariaLabel={t("balances.kpiAria")}
              iconSize={64}
              loading={isLoading}
              items={kpiItems.slice(0, 4)}
            />
            <StatsSummaryBar
              ariaLabel={t("balances.kpiAria")}
              iconSize={64}
              loading={isLoading}
              items={kpiItems.slice(4)}
            />
          </div>

          {isLoading && !data ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <EmptyState
              className="py-16"
              icon={<AlertTriangle className="h-12 w-12" />}
              title={t("balances.emptyTitle")}
              description={(loadError as Error | undefined)?.message || t("balances.emptyDesc")}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              className="py-16"
              icon={<Inbox className="h-12 w-12" />}
              title={t("balances.emptyTitle")}
              description={t("balances.emptyDesc")}
            />
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-[#e1e7f0] bg-white dark:border-white/10 dark:bg-[var(--color-surface-elevated)]">
              <Table className="min-w-[80rem] table-fixed border-separate border-spacing-0" wrapClassName={TABLE_WRAP}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={cn(thClass, "w-[16rem] text-nowrap")}>{t("balances.col.client")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8.5rem] text-end")}>{t("balances.col.qscPv")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8.5rem] text-end")}>{t("balances.col.ipmsMv")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8.5rem] text-end")}>{t("balances.col.ipmsNav")}</TableHead>
                    <TableHead className={cn(thClass, "w-[7rem]")}>{t("balances.col.pvVsMv")}</TableHead>
                    <TableHead className={cn(thClass, "w-[7.5rem]")}>{t("balances.col.pvVsNav")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8.5rem] text-end")}>{t("balances.col.qscCash")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8rem] text-end")}>{t("balances.col.ipmsCash")}</TableHead>
                    <TableHead className={cn(thClass, "w-[6.5rem]")}>{t("balances.col.cash")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8rem] text-end")}>{t("balances.col.bank")}</TableHead>
                    <TableHead className={cn(thClass, "w-[8.5rem]")}>{t("balances.col.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody key={`bal-${paging.page}-${paging.pageSize}`}>
                  {paging.paged.map((row: SnapshotCompareRow, i) => (
                    <TableRow
                      key={`bal-${paging.start + i}`}
                      className="min-h-[52px] border-b border-[#eef2f7] bg-white text-[13px] text-[#172b55] hover:bg-[#f7f9fd] dark:border-white/10 dark:bg-[var(--color-surface-elevated)] dark:text-[var(--color-text-primary)] dark:hover:bg-white/5"
                    >
                      <TableCell className="px-3.5 text-nowrap" style={cellPy}>
                        <Link href={`/customers/${row.clientId}`} className="font-semibold text-nowrap text-[#17356d] hover:underline">
                          {row.name || row.clientId}
                        </Link>
                        <div className="font-mono text-[11px] text-nowrap text-[#8a97b0]">
                          {row.clientId}
                          {row.nin ? ` · ${row.nin}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="px-3.5 text-end font-semibold" style={cellPy}>
                        <Money value={row.qscPortfolioValue} />
                      </TableCell>
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Money value={row.ipmsMarketValue} />
                      </TableCell>
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Money value={row.ipmsNavMvPlusCash} />
                      </TableCell>
                      <TableCell className="px-3.5" style={cellPy}>
                        <MatchChip ok={row.mvMatch} />
                      </TableCell>
                      <TableCell className="px-3.5" style={cellPy}>
                        <MatchChip ok={row.navMatch} />
                      </TableCell>
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Money value={row.qscSystemCash} />
                      </TableCell>
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Money value={row.ipmsCash} />
                      </TableCell>
                      <TableCell className="px-3.5" style={cellPy}>
                        <MatchChip ok={row.cashMatch} />
                      </TableCell>
                      <TableCell className="px-3.5 text-end" style={cellPy}>
                        <Money value={row.qscBankBalance} />
                        <div className="text-[10px] text-[#9aa6ba]">{t("balances.bankUnknown")}</div>
                      </TableCell>
                      <TableCell className="px-3.5" style={cellPy}>
                        <span
                          className={cn(
                            "inline-flex h-6 items-center rounded-md px-2 text-[11px] font-bold",
                            statusChipClass(row.status),
                          )}
                        >
                          {t(`balances.status.${row.status}`)}
                        </span>
                        {row.missingCloses.length > 0 ? (
                          <div
                            className="mt-0.5 max-w-[10rem] truncate text-[10px] text-[#9aa6ba]"
                            title={row.missingCloses.join(", ")}
                          >
                            {t("balances.missingCloses", { tickers: row.missingCloses.join(", ") })}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePageFooter
                total={paging.total}
                page={paging.page}
                pageSize={paging.pageSize}
                pageSizes={paging.pageSizes}
                loading={paging.busy}
                onPageChange={paging.setPage}
                onPageSizeChange={paging.setPageSize}
              />
            </div>
          )}
        </div>
      </section>

      {/* <p className="mt-8 text-sm text-muted-foreground">{t("balances.openQuestionsHint")}</p>
      <BlockedBoardTable rows={openQs?.rows ?? []} askPrefix="balances.ask" /> */}
    </Shell>
  );
}
