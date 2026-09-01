import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeftRight, Info, SearchX, Wallet } from "lucide-react";
import { BalanceIcon, FileIcon } from "@/components/phase1/ExportFormatIcons";
import { Shell } from "@/components/layout/Shell";
import { getExtClient, getExtClientCash, getExtClientShares, extClientDisplayName } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/phase1/DatePicker";
import { EmptyState } from "@/components/phase1/PageHeader";
import { WorkbookKpiBar } from "@/components/phase1/WorkbookKpiBar";
import { ClientHoldingsStation } from "@/components/phase1/ClientHoldingsStation";
import { ClientInfoPanel } from "@/components/phase1/ClientInfoPanel";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { DataTableCard, DataTableEmpty, DataTableHead, DataTableSkeletonRows } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import { buildClientHoldingsViewModel, emptyClientHoldingsViewModel } from "@/lib/clientHoldingsModel";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

const formatPrice3 = (val: number) =>
  new Intl.NumberFormat("en-QA", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(val);

const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });
const LEDGER_PAGE_SIZES = [10, 20, 25, 50];

function txCashClass(side: string) {
  if (side === "BUY") return "cdp-col-sell";
  if (side === "SELL") return "cdp-col-buy";
  return "";
}

export default function CustomerDetailExt() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [asOf, setAsOf] = useState(todayQatarIso);
  const [showSourceHints, setShowSourceHints] = useState(true);
  const [sharePage, setSharePage] = useState(1);
  const [sharePageSize, setSharePageSize] = useState(10);
  const [shareQ, setShareQ] = useState("");
  const [shareQDebounced, setShareQDebounced] = useState("");
  const [shareSide, setShareSide] = useState("");
  const [shareType, setShareType] = useState("");
  const [cashPage, setCashPage] = useState(1);
  const [cashPageSize, setCashPageSize] = useState(10);
  const [cashQ, setCashQ] = useState("");
  const [cashQDebounced, setCashQDebounced] = useState("");
  const [cashStatus, setCashStatus] = useState("");
  const today = todayQatarIso();
  const viewingPast = asOf < today;

  const { data, isLoading, isFetching, isError, error, isPlaceholderData } = useQuery({
    queryKey: ["ext-client", id, asOf],
    queryFn: () => getExtClient(id!, asOf),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

  const {
    data: sharesPage,
    isFetching: sharesFetching,
    isPlaceholderData: sharesPlaceholder,
    isPending: sharesPending,
  } = useQuery({
    queryKey: ["ext-client-shares", id, asOf, sharePage, sharePageSize, shareQDebounced, shareSide, shareType],
    queryFn: () => getExtClientShares(id!, asOf, sharePage, sharePageSize, {
      q: shareQDebounced || undefined,
      side: shareSide || undefined,
      invType: shareType || undefined,
    }),
    enabled: !!id && activeTab === "transactions",
    placeholderData: keepPreviousData,
  });

  const {
    data: cashLedger,
    isFetching: cashFetching,
    isPlaceholderData: cashPlaceholder,
    isPending: cashPending,
  } = useQuery({
    queryKey: ["ext-client-cash", id, asOf, cashPage, cashPageSize, cashQDebounced, cashStatus],
    queryFn: () => getExtClientCash(id!, asOf, cashPage, cashPageSize, {
      q: cashQDebounced || undefined,
      status: cashStatus || undefined,
    }),
    enabled: !!id && activeTab === "cash",
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setShareQDebounced(shareQ.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [shareQ]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCashQDebounced(cashQ.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [cashQ]);

  useEffect(() => {
    setSharePage(1);
    setCashPage(1);
  }, [asOf]);

  useEffect(() => { setSharePage(1); }, [shareQDebounced, shareSide, shareType, sharePageSize]);
  useEffect(() => { setCashPage(1); }, [cashQDebounced, cashStatus, cashPageSize]);

  const shares = sharesPage?.items ?? [];
  const cashRows = cashLedger?.items ?? [];
  const sharesBusy = sharesFetching && (sharesPlaceholder || sharesPending);
  const cashBusy = cashFetching && (cashPlaceholder || cashPending);


  const holdingsModel = useMemo(() => {
    if (!data) return null;
    const displayName = extClientDisplayName(data, i18n.language);
    return buildClientHoldingsViewModel({
      customer: {
        id: String(data.clientId),
        name: displayName,
        accountNumber: data.mainObjCode || data.accountNumber,
        idNumber: data.nin,
        portfolioId: String(data.clientId),
        totalInvested: data.totalInvested,
        currentValue: data.currentValue,
      },
      asOf,
      today,
      portfolio: {
        holdings: data.holdings,
        cashBalance: data.cashBalance,
        navValue: data.navValue,
        currentValue: data.currentValue,
        totalInvested: data.totalInvested,
        excelWorkbook: data.excelWorkbook,
        allocation: data.allocation,
        dailyChanges: data.dailyChanges,
        unrealizedPnL: data.unrealizedPnL,
        realizedPnL: data.realizedPnL,
      },
    });
  }, [data, asOf, today, i18n.language]);

  const booksLoading = isLoading || (isFetching && isPlaceholderData);

  if (isLoading && !data) {
    return (
      <Shell>
        <div className="cdp text-start" dir={i18n.dir()} aria-busy>
          <header className="cdp-header">
            <div className="cdp-title space-y-3">
              <Skeleton className="h-9 w-56 max-w-full rounded-full" />
              <Skeleton className="h-4 w-80 max-w-full rounded-full" />
            </div>
            <div className="cdp-header-actions">
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-44 rounded-full" />
            </div>
          </header>
          <WorkbookKpiBar nav={0} growthPct={null} gain={null} indexPct={null} loading />
          <Tabs value="overview" className="cdp-data">
            <CdpTabsList value="overview">
              <TabsTrigger value="overview" className={CDP_TAB}>{t("customerDetail.holdings")}</TabsTrigger>
              <TabsTrigger value="transactions" className={CDP_TAB} disabled>{t("customerDetail.transactions")}</TabsTrigger>
              <TabsTrigger value="cash" className={CDP_TAB} disabled>{t("customerDetail.cash")}</TabsTrigger>
              <TabsTrigger value="info" className={CDP_TAB} disabled>{t("customerDetail.clientDetails")}</TabsTrigger>
            </CdpTabsList>
            <TabsContent value="overview" className="cdp-pane mt-0 space-y-4">
              <ClientHoldingsStation
                model={emptyClientHoldingsViewModel()}
                variant="table"
                loading
              />
            </TabsContent>
          </Tabs>
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title={t("customerDetail.notFoundTitle")}
          description={(error as Error | undefined)?.message || t("customerDetail.notFoundDesc")}
          action={<Button asChild><Link href="/customers">{t("customerDetail.returnToClients")}</Link></Button>}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="cdp text-start" dir={i18n.dir()}>
        <header className=" mb-8 w-full max-w-full flex justify-between items-center">
          <div className="cdp-title text-nowrap !text-2xl">
            <h1>{extClientDisplayName(data, i18n.language) || t("customers2.noName")}</h1>
            <p className="m-0 text-sm text-[#586b94]">
              {t("customers2.nin")}:{" "}
              <bdi className="tabular-nums text-[var(--shell-blue)]" dir="ltr">{data.nin || "—"}</bdi>
              {" · "}
              {t("customers2.account")}:{" "}
              <bdi className="tabular-nums text-[var(--shell-blue)]" dir="ltr">{data.accountNumber}</bdi>
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="cdp-header-actions ms-auto">
              <button
                type="button"
                className={cn("cdp-more-metrics", showSourceHints && "is-open")}
                onClick={() => setShowSourceHints((v) => !v)}
                aria-pressed={showSourceHints}
              >
                <Info className="me-2 size-3.5" strokeWidth={1.75} />
                {showSourceHints ? t("customers2.hideHints") : t("customers2.showHints")}
              </button>
              <DatePicker
                className="cdp-date"
                prefix={t("historicalPortfolio.dateLabel")}
                value={asOf}
                onChange={(iso) => setAsOf(iso || today)}
                max={today}
              />
              <Button asChild variant="outline">
                <Link href={`/statements?client=${encodeURIComponent(id || "")}&kind=portfolio&asOf=${encodeURIComponent(asOf)}`}>
                  <FileIcon className="me-2 size-4" />
                  {t("statements.open")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/balances?client=${encodeURIComponent(id || "")}&asOf=${encodeURIComponent(asOf)}`}>
                  <BalanceIcon className="me-2 size-4" />
                  {t("balances.open")}
                </Link>
              </Button>
            </div>
          </div>
        </header>
        {viewingPast && (
          <div className="cdp-warn">{t("customerDetail.viewingPast", { asOf })}</div>
        )}

        <WorkbookKpiBar
          nav={holdingsModel?.nav ?? 0}
          growthPct={holdingsModel?.excelGrowthPct}
          gain={holdingsModel?.excelGain}
          indexPct={holdingsModel?.indexPerformancePct}
          indexName={holdingsModel?.indexName}
          indexFromDate={holdingsModel?.indexFromDate}
          indexToDate={holdingsModel?.indexToDate}
          loading={booksLoading}
          showSourceHints={showSourceHints}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="cdp-data">
          <CdpTabsList value={activeTab}>
            <TabsTrigger value="overview" className={CDP_TAB}>{t("customerDetail.holdings")}</TabsTrigger>
            <TabsTrigger value="transactions" className={CDP_TAB}>{t("customerDetail.transactions")}</TabsTrigger>
            <TabsTrigger value="cash" className={CDP_TAB}>{t("customerDetail.cash")}</TabsTrigger>
            <TabsTrigger value="info" className={CDP_TAB}>{t("customerDetail.clientDetails")}</TabsTrigger>
          </CdpTabsList>

          <TabsContent value="overview" className="cdp-pane mt-0 space-y-4">
            <ClientHoldingsStation
              model={holdingsModel || emptyClientHoldingsViewModel()}
              variant="table"
              loading={booksLoading}
              showSourceHints={showSourceHints}
            />
          </TabsContent>

          <TabsContent value="transactions" className="cdp-pane mt-0">
            <DataTableCard
              icon="/layers.png"
              count={`${sharesPage?.pagination.total ?? 0} ${t("customerDetail.transactions")}`}
              countLoading={sharesPending}
              search={shareQ}
              onSearchChange={setShareQ}
              searchPlaceholder={t("customers2.searchTx")}
              searchLabel={t("customers2.searchTx")}
              filterLabel={t("customers.filters")}
              filterCount={(shareSide ? 1 : 0) + (shareType ? 1 : 0)}
              filterPanel={
                <>
                  <SelectField
                    className="w-full"
                    contentClassName="clients-select-content"
                    value={shareSide}
                    onValueChange={setShareSide}
                    aria-label={t("common.side")}
                    options={[
                      { value: "", label: t("customers2.allSides") },
                      { value: "BUY", label: "BUY" },
                      { value: "SELL", label: "SELL" },
                      { value: "SP", label: "SP" },
                    ]}
                  />
                  <SelectField
                    className="w-full"
                    contentClassName="clients-select-content"
                    value={shareType}
                    onValueChange={setShareType}
                    aria-label={t("common.type")}
                    options={[
                      { value: "", label: t("customers2.allTypes") },
                      { value: "OI", label: "OI" },
                      { value: "OC", label: "OC" },
                      { value: "NI", label: "NI" },
                      { value: "SP", label: "SP" },
                    ]}
                  />
                </>
              }
              total={sharesPage?.pagination.total ?? 0}
              page={sharesPage?.pagination.page ?? sharePage}
              pageSize={sharePageSize}
              pageSizes={LEDGER_PAGE_SIZES}
              onPageChange={setSharePage}
              onPageSizeChange={(size) => { setSharePageSize(size); setSharePage(1); }}
              loading={sharesBusy}
            >
              <TableHeader>
                <TableRow className="clients-thead-row h-10">
                  <DataTableHead>{t("common.date")}</DataTableHead>
                  <DataTableHead>{t("statements.col.invNo")}</DataTableHead>
                  <DataTableHead>{t("common.stock")}</DataTableHead>
                  <DataTableHead>{t("common.type")}</DataTableHead>
                  <DataTableHead>{t("common.side")}</DataTableHead>
                  <DataTableHead align="end">{t("common.quantity")}</DataTableHead>
                  <DataTableHead align="end" hint={showSourceHints ? t("customers2.source.unitPrice") : undefined}>{t("common.price")}</DataTableHead>
                  <DataTableHead align="end">{t("customerDetail.total")}</DataTableHead>
                  <DataTableHead align="end">{t("statements.col.totalComm")}</DataTableHead>
                  <DataTableHead align="end">Net</DataTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharesBusy ? (
                  <DataTableSkeletonRows cols={10} rows={sharePageSize} />
                ) : shares.length === 0 ? (
                  <DataTableEmpty
                    colSpan={10}
                    icon={shareQ || shareSide || shareType
                      ? <SearchX className="size-7" strokeWidth={1.5} />
                      : <ArrowLeftRight className="size-7" strokeWidth={1.5} />}
                    title={shareQ || shareSide || shareType ? t("customers2.emptyTxMatchTitle") : t("customerDetail.noTxTitle")}
                    description={shareQ || shareSide || shareType ? t("customers2.emptyTxMatchDesc") : t("customerDetail.noTxDesc")}
                  />
                ) : (
                  shares.map((tx) => (
                    <TableRow key={tx.id} className="clients-row">
                      <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">{tx.invNo ?? "—"}</TableCell>
                      <TableCell>
                        <div className="cdp-stock">
                          <b>{tx.ticker}</b>
                          <span>{tx.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.invType}</TableCell>
                      <TableCell>
                        <span className={cn("cdp-type", tx.side === "BUY" && "is-buy", tx.side === "SELL" && "is-sell")}>
                          {tx.side}
                        </span>
                      </TableCell>
                      <TableCell className="text-end font-data">{tx.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-end font-data">{formatPrice3(tx.unitPrice)}</TableCell>
                      <TableCell className={cn("text-end font-data", txCashClass(tx.side))}>{formatCurrency(tx.total)}</TableCell>
                      <TableCell className="text-end font-data">{formatCurrency(tx.totalComm)}</TableCell>
                      <TableCell className={cn("text-end font-data", txCashClass(tx.side))}>{formatCurrency(tx.net)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="cash" className="cdp-pane mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t("customers.cash")}: <span className="font-data font-semibold">{formatCurrency(cashLedger?.balance ?? data.cashBalance)}</span>
            </p>
            <DataTableCard
              icon="/finance.png"
              count={`${cashLedger?.pagination.total ?? 0} ${t("customerDetail.cash")}`}
              countLoading={cashPending}
              search={cashQ}
              onSearchChange={setCashQ}
              searchPlaceholder={t("customers2.searchCash")}
              searchLabel={t("customers2.searchCash")}
              filterLabel={t("customers.filters")}
              filterCount={cashStatus ? 1 : 0}
              filterPanel={
                <SelectField
                  className="w-full"
                  contentClassName="clients-select-content"
                  value={cashStatus}
                  onValueChange={setCashStatus}
                  aria-label={t("common.status")}
                  options={[
                    { value: "", label: t("customers2.allStatuses") },
                    { value: "P", label: "P" },
                    { value: "A", label: "A" },
                  ]}
                />
              }
              total={cashLedger?.pagination.total ?? 0}
              page={cashLedger?.pagination.page ?? cashPage}
              pageSize={cashPageSize}
              pageSizes={LEDGER_PAGE_SIZES}
              onPageChange={setCashPage}
              onPageSizeChange={(size) => { setCashPageSize(size); setCashPage(1); }}
              loading={cashBusy}
            >
              <TableHeader>
                <TableRow className="clients-thead-row h-10">
                  <DataTableHead>{t("customerDetail.postDate")}</DataTableHead>
                  <DataTableHead>{t("statements.col.docDate")}</DataTableHead>
                  <DataTableHead>{t("common.type")}</DataTableHead>
                  <DataTableHead>{t("common.notes")}</DataTableHead>
                  <DataTableHead align="end">{t("common.status")}</DataTableHead>
                  <DataTableHead align="end">Debit</DataTableHead>
                  <DataTableHead align="end">Credit</DataTableHead>
                  <DataTableHead align="end" hint={showSourceHints ? t("customers2.source.cashAfter") : undefined}>{t("customerDetail.cashAfter")}</DataTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashBusy ? (
                  <DataTableSkeletonRows cols={8} rows={cashPageSize} />
                ) : cashRows.length === 0 ? (
                  <DataTableEmpty
                    colSpan={8}
                    icon={cashQ || cashStatus
                      ? <SearchX className="size-7" strokeWidth={1.5} />
                      : <Wallet className="size-7" strokeWidth={1.5} />}
                    title={cashQ || cashStatus ? t("customers2.emptyCashMatchTitle") : t("customers2.emptyCashTitle")}
                    description={cashQ || cashStatus ? t("customers2.emptyCashMatchDesc") : t("customers2.emptyCashDesc")}
                  />
                ) : (
                  cashRows.map((row) => (
                    <TableRow key={row.id} className="clients-row">
                      <TableCell className="font-mono text-sm">{row.postDate}</TableCell>
                      <TableCell className="font-mono text-sm">{row.docDate}</TableCell>
                      <TableCell className="font-mono text-xs">{row.docCode}</TableCell>
                      <TableCell className="max-w-[28rem] truncate text-sm">{row.eRemarks || row.remarks || "—"}</TableCell>
                      <TableCell className="text-end font-mono text-xs">{row.status}</TableCell>
                      <TableCell className="text-end font-data cdp-col-sell">{row.dbAmt ? formatCurrency(row.dbAmt) : "—"}</TableCell>
                      <TableCell className="text-end font-data cdp-col-buy">{row.crAmt ? formatCurrency(row.crAmt) : "—"}</TableCell>
                      <TableCell className="text-end font-data cdp-col-mv">{formatCurrency(row.balanceAfter)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </DataTableCard>
          </TabsContent>

          <TabsContent value="info" className="cdp-pane mt-0">
            <ClientInfoPanel data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
