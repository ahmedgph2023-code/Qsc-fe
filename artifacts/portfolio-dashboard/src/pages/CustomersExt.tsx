import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Inbox, Info, SearchX } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { getExtClients, extClientDisplayName, type ExtClientListRow } from "@/lib/api";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableCard, DataTableEmpty, DataTableHead, DataTableIconBtn, useTablePageBusy } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const PAGE_SIZES = [10, 25, 50];

const AVATAR_TONE = {
  blue: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  purple: "bg-[color-mix(in_srgb,#7956d8_16%,var(--color-surface-elevated))] text-[#6d4bd1]",
  gold: "bg-[var(--color-bronze-soft)] text-[var(--color-bronze)]",
} as const;

const cellPy = "!py-2 align-middle";
const COL_COUNT = 7;

function clientInitials(row: ExtClientListRow, locale: string) {
  const name = extClientDisplayName(row, locale);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  if (name && !/^NIN |^Account /.test(name)) return name.slice(0, 2).toUpperCase();
  const src = row.accountNumber || row.nin || "";
  return src.slice(-2).toUpperCase() || "—";
}

function avatarTone(key: string): keyof typeof AVATAR_TONE {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i)) % 3;
  return (["blue", "purple", "gold"] as const)[hash];
}

function CellLabel({ children }: { children: string }) {
  return (
    <span className="mb-1 hidden font-mono text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground max-[900px]:block">
      {children}
    </span>
  );
}

function ClientsExtSkeletonRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="clients-row pointer-events-none hover:bg-transparent">
          <TableCell className={cn(cellPy, "ps-5")} style={{ height: 58 }}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" style={{ animationDelay: `${i * 40}ms` }} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40 rounded-full" />
                <Skeleton className="h-2.5 w-52 max-w-full rounded-full" />
              </div>
            </div>
          </TableCell>
          {Array.from({ length: COL_COUNT - 2 }).map((__, j) => (
            <TableCell key={j} className={cellPy}><Skeleton className="h-3.5 w-20 rounded-full" /></TableCell>
          ))}
          <TableCell className={cn(cellPy, "pe-5")}><Skeleton className="size-8 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function CustomersExt() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showSourceHints, setShowSourceHints] = useState(true);

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ["ext-clients"],
    queryFn: () => getExtClients(),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((row) => {
      if (activity === "shares" && row.shareCount <= 0) return false;
      if (activity === "cashTxs" && row.cashCount <= 0) return false;
      if (activity === "cash" && Number(row.cashBalance || 0) === 0) return false;
      if (!q) return true;
      return [row.name, row.nameEn, row.nameAr, row.nin, row.accountNumber, row.mainObjCode, String(row.clientId)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [clients, search, activity]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const pageBusy = useTablePageBusy(safePage, pageSize);
  const tableBusy = isLoading || pageBusy;

  useEffect(() => { setPage(1); }, [search, pageSize, activity]);
  useEffect(() => { if (page !== safePage) setPage(safePage); }, [page, safePage]);

  const cashTotal = clients.reduce((sum, row) => sum + Number(row.cashBalance || 0), 0);
  const shareTxs = clients.reduce((sum, row) => sum + Number(row.shareCount || 0), 0);

  return (
    <Shell>
      <div className="clients-page flex flex-col gap-[22px]">
        <PageHeader
          className="mb-0 items-start border-b-0 pb-0"
          titleClassName="text-[clamp(2.1rem,4vw,3.05rem)] font-extrabold leading-[1.08] tracking-[-0.045em] text-[var(--color-text-primary)]"
          eyebrowClassName="text-[14px] font-extrabold normal-case tracking-[0.02em] text-[var(--color-bronze)]"
          descriptionClassName="mt-4 max-w-2xl text-[17px] font-medium leading-relaxed tracking-[-0.01em] text-[var(--color-text-secondary)]"
          title={t("customers2.title")}
          description={t("customers2.description")}
          actions={
            <button
              type="button"
              className={cn("cdp-more-metrics", showSourceHints && "is-open")}
              onClick={() => setShowSourceHints((v) => !v)}
              aria-pressed={showSourceHints}
            >
              <Info className="me-2 size-3.5" strokeWidth={1.75} />
              {showSourceHints ? t("customers2.hideHints") : t("customers2.showHints")}
            </button>
          }
        />

        <StatsSummaryBar
          ariaLabel={t("customers2.title")}
          loading={isLoading}
          columns={3}
          size="lg"
          items={[
            {
              id: "accounts",
              icon: "/user.png",
              label: t("customers.totalAccounts"),
              value: <AnimatedNumber value={clients.length} format="integer" />,
              hint: t("customers2.accountsHint"),
              info: showSourceHints ? t("customers2.source.accounts") : undefined,
            },
            {
              id: "cash",
              icon: "/finance.png",
              label: t("customers.cash"),
              value: <AnimatedNumber value={cashTotal} format="compactCurrency" />,
              hint: t("customers.acrossAll"),
              info: showSourceHints ? t("customers2.source.cash") : undefined,
            },
            {
              id: "shares",
              icon: "/layers.png",
              label: t("customers2.shares"),
              value: <AnimatedNumber value={shareTxs} format="integer" />,
              hint: t("customers2.sharesHint"),
              info: showSourceHints ? t("customers2.source.shares") : undefined,
            },
          ]}
        />

        {isError ? (
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("customers2.sqlUnreachable")}
            description={(error as Error)?.message}
          />
        ) : (
          <DataTableCard
            icon="/user.png"
            count={`${filtered.length} ${filtered.length === 1 ? t("customers.account") : t("customers.accounts")}`}
            countLoading={isLoading}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t("customers2.searchPlaceholder")}
            searchLabel={t("customers.searchClients")}
            hotkey
            filterLabel={t("customers.filters")}
            filterCount={activity ? 1 : 0}
            filterPanel={
              <SelectField
                className="w-full"
                contentClassName="clients-select-content"
                value={activity}
                onValueChange={setActivity}
                aria-label={t("customers2.activityFilter")}
                options={[
                  { value: "", label: t("customers2.allActivity") },
                  { value: "shares", label: t("customers2.withShares") },
                  { value: "cashTxs", label: t("customers2.withCashTxs") },
                  { value: "cash", label: t("customers2.withCash") },
                ]}
              />
            }
            total={filtered.length}
            page={safePage}
            pageSize={pageSize}
            pageSizes={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={tableBusy}
            summary={
              filtered.length === 0
                ? t("customers.showingZero")
                : t("customers.showingRange", {
                    from: start + 1,
                    to: Math.min(start + pageSize, filtered.length),
                    total: filtered.length,
                  })
            }
          >
            <TableHeader>
              <TableRow className="clients-thead-row h-10">
                <DataTableHead className="ps-5">{t("common.client")}</DataTableHead>
                <DataTableHead>{t("customers2.nin")}</DataTableHead>
                <DataTableHead>{t("customers2.account")}</DataTableHead>
                <DataTableHead align="end" hint={showSourceHints ? t("customers2.source.cashRow") : undefined}>{t("customers.cash")}</DataTableHead>
                <DataTableHead align="end" hint={showSourceHints ? t("customers2.source.shareCount") : undefined}>{t("customers2.shares")}</DataTableHead>
                <DataTableHead align="end" hint={showSourceHints ? t("customers2.source.cashCount") : undefined}>{t("customers2.cashTxs")}</DataTableHead>
                <DataTableHead className="w-12 pe-5">{""}</DataTableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="max-[900px]:block max-[900px]:w-full">
              {tableBusy ? (
                <ClientsExtSkeletonRows rows={pageSize} />
              ) : paged.length === 0 ? (
                <DataTableEmpty
                  colSpan={COL_COUNT}
                  icon={search || activity ? <SearchX className="size-7" strokeWidth={1.5} /> : <Inbox className="size-7" strokeWidth={1.5} />}
                  title={search || activity ? t("customers2.emptyMatchTitle") : t("customers2.emptyTitle")}
                  description={search || activity ? t("customers2.emptyMatchDesc") : t("customers2.emptyDesc")}
                />
              ) : (
                paged.map((row) => {
                  const tone = avatarTone(row.accountNumber || row.nin);
                  const title = extClientDisplayName(row, i18n.language) || t("customers2.noName");
                  return (
                    <TableRow key={row.id} className="clients-row group max-[900px]:relative max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:items-start max-[900px]:gap-x-4 max-[900px]:gap-y-3 max-[900px]:px-4 max-[900px]:py-3 max-[900px]:pe-14 max-[520px]:grid-cols-1 max-[520px]:pe-4 max-[520px]:pt-12">
                      <TableCell className={cn(cellPy, "ps-5 max-[900px]:col-span-2 max-[900px]:!p-0")}>
                        <Link href={`/customers/${row.clientId}`} className="flex min-w-0 items-center gap-3">
                          <div className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[12px] font-extrabold", AVATAR_TONE[tone])}>
                            {clientInitials(row, i18n.language)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold leading-tight text-[var(--shell-ink)]">
                              {title}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[var(--shell-muted)]" dir="ltr">
                              {row.nin ? `${t("customers2.nin")} ${row.nin}` : t("customers2.noName")}
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground" dir="ltr">
                              {t("customers2.account")} {row.accountNumber}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className={cn(cellPy, "font-data max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")} dir="ltr">
                        <CellLabel>{t("customers2.nin")}</CellLabel>
                        {row.nin || "—"}
                      </TableCell>
                      <TableCell className={cn(cellPy, "font-data max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")} dir="ltr">
                        <CellLabel>{t("customers2.account")}</CellLabel>
                        {row.accountNumber}
                      </TableCell>
                      <TableCell className={cn(cellPy, "text-end font-data tabular-nums max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                        <CellLabel>{t("customers.cash")}</CellLabel>
                        {formatCurrency(row.cashBalance)}
                      </TableCell>
                      <TableCell className={cn(cellPy, "text-end font-data max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                        <CellLabel>{t("customers2.shares")}</CellLabel>
                        {row.shareCount.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(cellPy, "text-end font-data max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                        <CellLabel>{t("customers2.cashTxs")}</CellLabel>
                        {row.cashCount.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(cellPy, "pe-5 max-[900px]:absolute max-[900px]:end-3 max-[900px]:top-3 max-[900px]:!p-0")}>
                        <DataTableIconBtn
                          label={t("customers2.openAccount")}
                          icon={<ExternalLink />}
                          onClick={() => setLocation(`/customers/${row.clientId}`)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </DataTableCard>
        )}
      </div>
    </Shell>
  );
}
