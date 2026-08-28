import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState, StatTile } from "@/components/phase1/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import { QuoteBoard, quoteLogoLabel } from "@/components/phase1/QuoteBoard";
import {
  getMarketOverview, runScreener, listApprovedList, setApprovedListStatus,
  getCompanyResearch, upsertResearchLayer, requestResearchException,
  getStockAnalytics, listShariaEsg, createShariaEsgReview,
  listStrategies, createStrategy, transitionStrategy, listStockScores,
  getStocks, type StockData,
} from "@/lib/api";

const LAYERS = ["macro", "fundamental", "valuation", "internal", "technical"] as const;

const LAYER_KEYS: Record<(typeof LAYERS)[number], string> = {
  macro: "phase3.layerMacro",
  fundamental: "phase3.layerFundamental",
  valuation: "phase3.layerValuation",
  internal: "phase3.layerInternal",
  technical: "phase3.layerTechnical",
};

export default function MarketsOverviewPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ["market-overview"], queryFn: getMarketOverview });

  return (
    <Shell>
      <PageHeader
        title={t("phase3.marketsTitle")}
        description={t("phase3.marketsDesc")}
      />
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(data.indices ?? []).slice(0, 4).map((idx) => (
              <StatTile
                key={idx.id}
                label={idx.name}
                value={idx.level != null ? idx.level.toFixed(2) : "—"}
                hint={idx.changePct != null ? `${idx.changePct >= 0 ? "+" : ""}${idx.changePct.toFixed(2)}%` : (data.asOf ?? "")}
              />
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatTile label={t("phase3.advancers")} value={String(data.breadth.advancers)} hint={data.breadth.asOf ?? ""} />
            <StatTile label={t("phase3.decliners")} value={String(data.breadth.decliners)} hint="" />
            <StatTile label={t("phase3.unchanged")} value={String(data.breadth.unchanged)} hint="" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MoversTable title={t("phase3.topGainers")} rows={data.topGainers} />
            <MoversTable title={t("phase3.topLosers")} rows={data.topLosers} />
          </div>
        </>
      )}
    </Shell>
  );
}

function MoversTable({ title, rows }: { title: string; rows: Array<{ stockId: string; ticker: string; changePct: number; close: number }> }) {
  const { t } = useTranslation();
  return (
    <QuoteBoard
      title={title}
      icon="/growth.png"
      showTrend={false}
      emptyTitle={t("phase3.emptyMoversTitle")}
      emptyDescription={t("phase3.emptyMoversDesc")}
      paginate={false}
      columns={{
        asset: t("common.ticker"),
        price: t("phase3.colClose"),
        day: t("phase3.colPct"),
      }}
      rows={rows.map((r) => ({
        id: r.stockId,
        href: `/research/companies/${r.stockId}`,
        logo: quoteLogoLabel(r.ticker),
        title: r.ticker,
        price: r.close.toFixed(2),
        priceCaption: t("common.currencyValue"),
        dayPct: r.changePct,
      }))}
    />
  );
}

export function ScreenerPage() {
  const { t } = useTranslation();
  const [sector, setSector] = useState("");
  const [shariahGroup, setShariahGroup] = useState("");
  const [search, setSearch] = useState("");
  const [qeriOnly, setQeriOnly] = useState(false);
  const filters = useMemo(() => ({
    sector: sector || undefined,
    shariahGroup: shariahGroup || undefined,
    search: search || undefined,
    qeriMember: qeriOnly || undefined,
  }), [sector, shariahGroup, search, qeriOnly]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["screener", filters],
    queryFn: () => runScreener(filters),
  });
  const screenerRows = data?.data ?? [];
  const paging = useClientTablePage(screenerRows, JSON.stringify(filters));

  return (
    <Shell>
      <PageHeader title={t("phase3.screenerTitle")} description={t("phase3.screenerDesc")} />
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4">
        <div className="space-y-1">
          <Label>{t("common.search")}</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("phase3.searchPlaceholder")} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>{t("common.sector")}</Label>
          <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder={t("phase3.sectorPlaceholder")} className="w-36" />
        </div>
        <div className="space-y-1">
          <Label>{t("common.shariah")}</Label>
          <SelectField
            value={shariahGroup || "__any"}
            onValueChange={(v) => setShariahGroup(v === "__any" ? "" : v)}
            options={[
              { value: "__any", label: t("phase3.any") },
              { value: "shariah", label: "shariah" },
              { value: "not_shariah", label: "not_shariah" },
            ]}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={qeriOnly} onChange={(e) => setQeriOnly(e.target.checked)} />
          {t("phase3.qeriOnly")}
        </label>
        <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>{t("common.refresh")}</Button>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">{t("phase3.namesAsOf", { count: data?.count ?? 0, asOf: data?.asOf ?? "—" })}</p>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.sector")}</TableHead>
              <TableHead>{t("common.shariah")}</TableHead>
              <TableHead>{t("phase3.colApproved")}</TableHead>
              <TableHead className="text-end">{t("phase3.colClose")}</TableHead>
              <TableHead className="text-end">{t("phase3.colAdtv")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/research/companies/${r.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {r.ticker}
                  </Link>
                </TableCell>
                <TableCell>{r.sector}</TableCell>
                <TableCell>{r.shariahGroup ?? "—"}</TableCell>
                <TableCell><Badge variant="outline">{r.approvedListStatus}</Badge></TableCell>
                <TableCell className="text-end font-data">{r.lastClose?.toFixed(2) ?? "—"}</TableCell>
                <TableCell className="text-end font-data">{r.avgDailyTradedValue?.toLocaleString() ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function ApprovedListPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const { data } = useQuery({ queryKey: ["approved-list"], queryFn: () => listApprovedList() });
  const approvedRows = data?.data ?? [];
  const paging = useClientTablePage(approvedRows, String(approvedRows.length));
  const [stockId, setStockId] = useState("");
  const [status, setStatus] = useState("watchlist");
  const save = useMutation({
    mutationFn: () => setApprovedListStatus(stockId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["approved-list"] }),
  });
  const stockOptions = useMemo(
    () => (stocks as StockData[]).map((s) => ({ value: s.id, label: `${s.ticker} · ${s.companyName}` })),
    [stocks],
  );
  const approvedStatuses = useMemo(() => [
    { value: "approved_buy", label: t("phase3.statusApprovedBuy") },
    { value: "hold", label: t("phase3.statusHold") },
    { value: "sell_only", label: t("phase3.statusSellOnly") },
    { value: "watchlist", label: t("phase3.statusWatchlist") },
    { value: "restricted", label: t("phase3.statusRestricted") },
  ], [t]);

  return (
    <Shell>
      <PageHeader title={t("phase3.approvedTitle")} description={t("phase3.approvedDesc")} />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <SelectField value={stockId} onValueChange={setStockId} options={stockOptions} placeholder={t("common.stock")} />
        <SelectField value={status} onValueChange={setStatus} options={approvedStatuses} />
        <Button disabled={!stockId || save.isPending} onClick={() => save.mutate()}>{t("phase3.setStatus")}</Button>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead>{t("common.sector")}</TableHead>
              <TableHead>{t("phase3.colNotes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvedRows.length === 0 ? (
              <TableRow><TableCell colSpan={4}><EmptyState title={t("phase3.emptyListTitle")} description={t("phase3.emptyListDesc")} /></TableCell></TableRow>
            ) : paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Link href={`/research/companies/${r.stockId}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    {r.ticker}
                  </Link>
                </TableCell>
                <TableCell><Badge>{r.status}</Badge></TableCell>
                <TableCell>{r.sector}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{r.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function CompanyAnalysisPage() {
  const { t } = useTranslation();
  const params = useParams<{ stockId: string }>();
  const stockId = params.stockId ?? "";
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company-research", stockId],
    queryFn: () => getCompanyResearch(stockId),
    enabled: !!stockId,
  });
  const { data: analytics } = useQuery({
    queryKey: ["stock-analytics", stockId],
    queryFn: () => getStockAnalytics(stockId, 90),
    enabled: !!stockId,
  });
  const saveLayer = useMutation({
    mutationFn: (body: { layer: string; status: string }) =>
      upsertResearchLayer(stockId, body.layer, { status: body.status, assessedAt: new Date().toISOString().slice(0, 10) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-research", stockId] }),
  });
  const exception = useMutation({
    mutationFn: () => requestResearchException(stockId, "Formal five-layer exception request"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company-research", stockId] }),
  });

  const layerList = [...LAYERS];
  const layerPaging = useClientTablePage(layerList, stockId);
  const seriesRows = [...(analytics?.series ?? [])].reverse();
  const seriesPaging = useClientTablePage(seriesRows, stockId);

  if (!stockId) {
    return (
      <Shell>
        <PageHeader title={t("phase3.companyTitle")} description={t("phase3.companyDescPick")} />
        <EmptyState title={t("phase3.noStockSelectedTitle")} description={t("phase3.noStockSelectedDesc")} />
      </Shell>
    );
  }

  const last = analytics?.series?.slice(-1)[0];
  const withMa = analytics?.series?.filter((p) => p.ma50 != null).slice(-1)[0];

  return (
    <Shell>
      <PageHeader
        title={data ? t("phase3.companyTitleWithTicker", { ticker: data.stock.ticker }) : t("phase3.companyTitle")}
        description={data?.note ?? t("phase3.companyDescDefault")}
      />
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
      {data && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatTile label={t("phase3.approvedList")} value={data.approvedList.status} hint={data.stock.sector} />
            <StatTile
              label={t("phase3.satelliteGate")}
              value={data.satelliteGate.allowed ? t("phase3.allowed") : t("phase3.blocked")}
              hint={data.satelliteGate.message}
            />
            <StatTile
              label={t("phase3.closeMa50")}
              value={last ? last.close.toFixed(2) : "—"}
              hint={withMa?.ma50 != null ? t("phase3.ma50Hint", { value: withMa.ma50.toFixed(2) }) : t("phase3.need50Sessions")}
            />
          </div>
          <AppTable
            className="mb-4"
            footer={<ClientTableFooter paging={layerPaging} />}
            toolbar={
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{t("phase3.fiveLayerChecklist")}</h3>
                <Button size="sm" variant="secondary" onClick={() => exception.mutate()} disabled={exception.isPending}>
                  {t("phase3.requestException")}
                </Button>
              </div>
            }
          >
            <TableHeader>
                <TableRow>
                  <TableHead>{t("phase3.colLayer")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-end">{t("common.set")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layerPaging.paged.map((layer) => {
                  const row = data.layers.find((l) => l.layer === layer);
                  return (
                    <TableRow key={layer}>
                      <TableCell>{t(LAYER_KEYS[layer])}</TableCell>
                      <TableCell><Badge variant="outline">{row?.status ?? t("phase3.incomplete")}</Badge></TableCell>
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          {(["pass", "watch", "fail"] as const).map((st) => (
                            <Button
                              key={st}
                              size="sm"
                              variant={row?.status === st ? "default" : "outline"}
                              onClick={() => saveLayer.mutate({ layer, status: st })}
                            >
                              {st === "pass" ? t("common.pass") : st === "fail" ? t("common.fail") : t("phase3.watch")}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
          </AppTable>
          <AppTable
            toolbar={
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">{t("phase3.analyticsTitle")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{analytics?.note}</p>
              </div>
            }
            footer={<ClientTableFooter paging={seriesPaging} />}
          >
            <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead className="text-end">{t("phase3.colClose")}</TableHead>
                      <TableHead className="text-end">{t("phase3.colVolume")}</TableHead>
                      <TableHead className="text-end">{t("phase3.colMa50")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {seriesPaging.paged.map((p) => (
                    <TableRow key={p.date}>
                      <TableCell className="font-data">{p.date}</TableCell>
                      <TableCell className="text-end font-data">{p.close.toFixed(2)}</TableCell>
                      <TableCell className="text-end font-data">{p.volume?.toLocaleString() ?? "—"}</TableCell>
                      <TableCell className="text-end font-data">{p.ma50?.toFixed(2) ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
          </AppTable>
        </>
      )}
    </Shell>
  );
}

export function ShariaEsgPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });
  const { data } = useQuery({ queryKey: ["sharia-esg"], queryFn: listShariaEsg });
  const shariaRows = data?.data ?? [];
  const paging = useClientTablePage(shariaRows, String(shariaRows.length));
  const [stockId, setStockId] = useState("");
  const [shariahGroup, setShariahGroup] = useState("shariah");
  const [syncToStock, setSyncToStock] = useState(true);
  const create = useMutation({
    mutationFn: () => createShariaEsgReview({
      stockId,
      shariahGroup,
      reviewDate: new Date().toISOString().slice(0, 10),
      syncToStock,
      esgScore: null,
      esgNotes: "UNKNOWN until QSC provides ESG data",
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sharia-esg"] }),
  });
  const stockOptions = useMemo(
    () => (stocks as StockData[]).map((s) => ({ value: s.id, label: `${s.ticker} · ${s.companyName}` })),
    [stocks],
  );

  return (
    <Shell>
      <PageHeader title={t("phase3.shariaTitle")} description={data?.esgNote ?? t("phase3.shariaDescDefault")} />
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-2xl border bg-card p-4">
        <SelectField value={stockId} onValueChange={setStockId} options={stockOptions} placeholder={t("common.stock")} />
        <SelectField
          value={shariahGroup}
          onValueChange={setShariahGroup}
          options={[
            { value: "shariah", label: "shariah" },
            { value: "not_shariah", label: "not_shariah" },
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={syncToStock} onChange={(e) => setSyncToStock(e.target.checked)} />
          {t("phase3.syncToStockMaster")}
        </label>
        <Button disabled={!stockId || create.isPending} onClick={() => create.mutate()}>{t("phase3.addReview")}</Button>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.shariah")}</TableHead>
              <TableHead>{t("phase3.colEsg")}</TableHead>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("phase3.colSynced")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.ticker}</TableCell>
                <TableCell>{r.shariahGroup ?? "—"}</TableCell>
                <TableCell>{r.esgScore ?? "UNKNOWN"}</TableCell>
                <TableCell className="font-data">{r.reviewDate ?? "—"}</TableCell>
                <TableCell>{r.syncToStock ? t("common.yes") : t("common.no")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function StrategiesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["strategies"], queryFn: listStrategies });
  const strategyRows = data?.data ?? [];
  const paging = useClientTablePage(strategyRows, String(strategyRows.length));
  const [modelCode, setModelCode] = useState("FS_MED");
  const [title, setTitle] = useState("");
  const create = useMutation({
    mutationFn: () => createStrategy({ modelCode, title: title || `${modelCode} strategy` }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      setTitle("");
    },
  });
  const transition = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => transitionStrategy(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["strategies"] }),
  });

  return (
    <Shell>
      <PageHeader title={t("phase3.strategiesTitle")} description={t("phase3.strategiesDesc")} />
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border bg-card p-4">
        <Input value={modelCode} onChange={(e) => setModelCode(e.target.value)} placeholder="FS_MED" className="max-w-[8rem]" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("phase3.titlePlaceholder")} className="max-w-xs" />
        <Button onClick={() => create.mutate()} disabled={create.isPending}>{t("phase3.createDraft")}</Button>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase3.colModel")}</TableHead>
              <TableHead>{t("phase3.colTitle")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-data">{s.modelCode}</TableCell>
                <TableCell>{s.title}</TableCell>
                <TableCell><Badge>{s.approvalStatus}</Badge></TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  {s.approvalStatus === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: s.id, status: "pending_ic" })}>{t("phase3.submitIc")}</Button>
                  )}
                  {s.approvalStatus === "pending_ic" && (
                    <Button size="sm" onClick={() => transition.mutate({ id: s.id, status: "approved" })}>{t("common.approve")}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}

export function ScoringPage() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ["stock-scores"], queryFn: listStockScores });
  const scoreRows = data?.scores ?? [];
  const paging = useClientTablePage(scoreRows, String(scoreRows.length));

  return (
    <Shell>
      <PageHeader title={t("phase3.scoringTitle")} description={t("phase3.scoringDesc")} />
      <div className="mb-4 rounded-2xl border bg-card p-4 text-sm">
        <p>{data?.message}</p>
        <p className="mt-1 text-muted-foreground">
          {t("phase3.confirmedLine", {
            confirmed: data?.config?.confirmed ? t("common.yes") : t("common.no"),
            notes: data?.config?.notes ?? "",
          })}
        </p>
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("phase3.colRank")}</TableHead>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead className="text-end">{t("common.score")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scoreRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <EmptyState title={t("phase3.emptyScoresTitle")} description={t("phase3.emptyScoresDesc")} />
                </TableCell>
              </TableRow>
            ) : paging.paged.map((s) => (
              <TableRow key={s.stockId}>
                <TableCell>{s.rank ?? "—"}</TableCell>
                <TableCell>{s.ticker}</TableCell>
                <TableCell className="text-end font-data">{s.score ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
    </Shell>
  );
}
