import { Shell } from "@/components/layout/Shell";
import { getSectorDetail, type SectorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/phase1/PageHeader";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { HcoAssetIcon, HcoMetricCard } from "@/components/phase1/HoldingsCashOverview";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { cn } from "@/lib/utils";

const REC_TONES: Record<string, { tone: string; valueClass: string; hco: "gain" | "warn" | "bronze"; labelKey: string }> = {
  STRONG_BUY: { tone: "#139366", valueClass: "text-gain", hco: "gain", labelKey: "sectorDetail.strongBuy" },
  BUY: { tone: "#18a270", valueClass: "text-gain", hco: "gain", labelKey: "sectorDetail.buy" },
  HOLD: { tone: "#e98921", valueClass: "text-[#b06a14]", hco: "bronze", labelKey: "sectorDetail.hold" },
  REDUCE: { tone: "#e24b57", valueClass: "text-loss", hco: "warn", labelKey: "sectorDetail.reduce" },
  EXIT: { tone: "#d12b3a", valueClass: "text-loss", hco: "warn", labelKey: "sectorDetail.exit" },
};

const IMPACT_KEYS: Record<string, string> = {
  HIGH: "sectorDetail.impactHigh",
  MEDIUM: "sectorDetail.impactMed",
  LOW: "sectorDetail.impactLow",
};

const SCORE_BANDS = [
  { range: "0–34", labelKey: "sectorDetail.exit", tone: "#d12b3a", start: 0, width: 35 },
  { range: "35–49", labelKey: "sectorDetail.reduce", tone: "#e24b57", start: 35, width: 15 },
  { range: "50–64", labelKey: "sectorDetail.hold", tone: "#e98921", start: 50, width: 15 },
  { range: "65–79", labelKey: "sectorDetail.buy", tone: "#18a270", start: 65, width: 15 },
  { range: "80–100", labelKey: "sectorDetail.strongBuy", tone: "#139366", start: 80, width: 20 },
];

function sentimentClass(sentiment: string | null) {
  if (sentiment === "POSITIVE") return "text-gain";
  if (sentiment === "NEGATIVE") return "text-loss";
  return "text-[#b06a14]";
}

export default function SectorDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: sector, isLoading } = useQuery({
    queryKey: ["sector", id],
    queryFn: () => getSectorDetail(id!),
    enabled: !!id,
  });

  const parsedArt = (sector?.articles ?? []).map((a) => ({
    ...a,
    parsedDrivers: Array.isArray(a.keyDrivers) ? a.keyDrivers : [],
    parsedRisks: Array.isArray(a.risks) ? a.risks : [],
  }));
  const paging = useClientTablePage(parsedArt, String(parsedArt.length));

  const recMeta = (rec: string) => {
    const cfg = REC_TONES[rec] || REC_TONES.HOLD;
    return { ...cfg, label: t(cfg.labelKey) };
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="cdp space-y-6 py-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-[19px] sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-[20px]" />
            ))}
          </div>
          <Skeleton className="h-10 w-full max-w-3xl" />
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </Shell>
    );
  }

  if (!sector) {
    return (
      <Shell>
        <div className="cdp">
          <EmptyState
            icon={<AlertTriangle className="h-12 w-12" />}
            title={t("sectorDetail.notFoundTitle")}
            description={t("sectorDetail.notFoundDesc")}
            action={<Button asChild><Link href="/sectors">{t("sectorDetail.back")}</Link></Button>}
          />
        </div>
      </Shell>
    );
  }

  const meta = recMeta(sector.recommendation);
  const confidenceComponents = getConfidenceComponents(sector, t);
  const totalArts = sector.totalArticles || 0;

  return (
    <Shell>
      <div className="cdp">
        <Link
          href="/sectors"
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground no-underline hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          {t("sectorDetail.back")}
        </Link>

        <header className="cdp-header">
          <div className="cdp-title">
            <h1>{sector.name}</h1>
            <p>{sector.description || t("sectorDetail.defaultDesc")}</p>
          </div>
          <div className="cdp-header-actions">
            <span
              className={cn(
                "inline-flex h-10 items-center rounded-[14px] border border-[#dfe6f6] bg-gradient-to-br from-white to-[#eef3fd] px-3 text-xs font-bold shadow-[var(--cdp-shadow2)]",
                meta.valueClass,
              )}
            >
              {meta.label}
            </span>
            <span className="inline-flex h-10 items-center rounded-[14px] border border-[#dfe6f6] bg-gradient-to-br from-white to-[#eef3fd] px-3 font-data text-sm font-bold text-[#1a2b4c] shadow-[var(--cdp-shadow2)]">
              {sector.score}/100
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-[19px] sm:grid-cols-2 xl:grid-cols-4">
          <HcoMetricCard
            tone={meta.hco}
            icon={<HcoAssetIcon src="/analytics.png" />}
            label={t("common.score")}
            value={<AnimatedNumber value={sector.score} format="integer" />}
            note={meta.label}
          />
          <HcoMetricCard
            tone="info"
            icon={<HcoAssetIcon src="/layers.png" />}
            label={t("common.confidence")}
            value={<AnimatedNumber value={sector.confidence} format="percent" digits={0} />}
            note={t("sectorDetail.modelConfidence")}
          />
          <HcoMetricCard
            tone="purple"
            icon={<HcoAssetIcon src="/growth.png" />}
            label={t("common.sentiment")}
            value={<AnimatedNumber value={sector.sentimentScore} format="integer" />}
            note={t("sectorDetail.scaleOf100")}
          />
          <HcoMetricCard
            tone="cyan"
            icon={<HcoAssetIcon src="/bank.png" />}
            label={t("common.articles")}
            value={<AnimatedNumber value={sector.totalArticles} format="integer" />}
            note={t("sectorDetail.articlesNote", { pos: sector.positiveArticles, neg: sector.negativeArticles })}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="cdp-data">
          <CdpTabsList value={activeTab}>
            <TabsTrigger value="overview" className={CDP_TAB}>{t("sectorDetail.tabOverview")}</TabsTrigger>
            <TabsTrigger value="news" className={CDP_TAB}>{t("sectorDetail.tabNews", { count: parsedArt.length })}</TabsTrigger>
          </CdpTabsList>

          <TabsContent value="overview" className="cdp-pane mt-0 space-y-4">
            {sector.explanation && (
              <section className="cdp-sectors mx-0" aria-labelledby="ai-explain-title">
                <header className="cdp-sectors-head">
                  <div>
                    <h3 id="ai-explain-title">{t("sectorDetail.aiExplanation")}</h3>
                    <p>{t("sectorDetail.aiExplanationSub")}</p>
                  </div>
                </header>
                <p className="py-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {sector.explanation}
                </p>
              </section>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="cdp-sectors mx-0 xl:col-span-2" aria-labelledby="score-break-title">
                <header className="cdp-sectors-head">
                  <div>
                    <h3 id="score-break-title">{t("sectorDetail.scoreBreakdown")}</h3>
                    <p>{t("sectorDetail.scoreBreakdownSub")}</p>
                  </div>
                </header>
                <div className="relative mb-2 mt-4 h-8 overflow-hidden rounded-full bg-[#e8ecf7]" dir="ltr">
                  {SCORE_BANDS.map((band) => (
                    <div
                      key={band.labelKey}
                      className="absolute top-0 h-full opacity-25"
                      style={{ insetInlineStart: `${band.start}%`, width: `${band.width}%`, background: band.tone }}
                    />
                  ))}
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                    style={{ insetInlineStart: `${Math.min(sector.score, 98)}%`, background: meta.tone }}
                  />
                </div>
                <div className="mb-6 flex justify-between px-0.5 font-mono text-[10px] uppercase text-muted-foreground" dir="ltr">
                  {SCORE_BANDS.map((band) => (
                    <span key={band.labelKey} style={{ color: sector.score >= band.start ? band.tone : undefined }}>
                      {t(band.labelKey)} {band.range}
                    </span>
                  ))}
                </div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {t("sectorDetail.confidenceComponents", { pct: sector.confidence })}
                </p>
                <div className="space-y-3">
                  {confidenceComponents.map((comp) => (
                    <div key={comp.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{comp.label}</span>
                        <span className="font-data">{comp.value}/{comp.max}</span>
                      </div>
                      <div className="hco-progress">
                        <span style={{ width: `${comp.pct}%`, background: "linear-gradient(90deg, #3c75f3cc, #1454df)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="cdp-sectors mx-0" aria-labelledby="sent-title">
                <header className="cdp-sectors-head">
                  <div>
                    <h3 id="sent-title">{t("sectorDetail.sentimentDist")}</h3>
                    <p>{sector.sentimentScore}/100</p>
                  </div>
                </header>
                <div className="cdp-sectors-mix mt-4" aria-hidden="true">
                  {totalArts > 0 ? (
                    <>
                      <i style={{ width: `${(sector.positiveArticles / totalArts) * 100}%`, background: "#18a270" }} />
                      <i style={{ width: `${(sector.neutralArticles / totalArts) * 100}%`, background: "#e98921" }} />
                      <i style={{ width: `${(sector.negativeArticles / totalArts) * 100}%`, background: "#e24b57" }} />
                    </>
                  ) : (
                    <i style={{ width: "100%", background: "#dfe6f6" }} />
                  )}
                </div>
                <ul className="cdp-sectors-list">
                  <li className="cdp-sector">
                    <div className="cdp-sector-top">
                      <span className="cdp-sector-name"><i style={{ background: "#18a270" }} /> {t("sectorDetail.positive")}</span>
                      <em className="font-data">{sector.positiveArticles}</em>
                    </div>
                  </li>
                  <li className="cdp-sector">
                    <div className="cdp-sector-top">
                      <span className="cdp-sector-name"><i style={{ background: "#e98921" }} /> {t("sectorDetail.neutral")}</span>
                      <em className="font-data">{sector.neutralArticles}</em>
                    </div>
                  </li>
                  <li className="cdp-sector">
                    <div className="cdp-sector-top">
                      <span className="cdp-sector-name"><i style={{ background: "#e24b57" }} /> {t("sectorDetail.negative")}</span>
                      <em className="font-data">{sector.negativeArticles}</em>
                    </div>
                  </li>
                </ul>
              </section>
            </div>

            {(sector.positiveDrivers.length > 0 || sector.topRisks.length > 0) && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {sector.positiveDrivers.length > 0 && (
                  <section className="cdp-sectors mx-0" aria-labelledby="drivers-title">
                    <header className="cdp-sectors-head">
                      <div>
                        <h3 id="drivers-title">{t("sectorDetail.positiveDrivers")}</h3>
                        <p>{t("sectorDetail.positiveDriversSub")}</p>
                      </div>
                    </header>
                    <ul className="cdp-sectors-list">
                      {sector.positiveDrivers.map((d, i) => (
                        <li key={`${d}-${i}`} className="cdp-sector">
                          <span className="cdp-sector-name">
                            <i style={{ background: "#18a270" }} />
                            {d}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {sector.topRisks.length > 0 && (
                  <section className="cdp-sectors mx-0" aria-labelledby="risks-title">
                    <header className="cdp-sectors-head">
                      <div>
                        <h3 id="risks-title">{t("sectorDetail.topRisks")}</h3>
                        <p>{t("sectorDetail.topRisksSub")}</p>
                      </div>
                    </header>
                    <ul className="cdp-sectors-list">
                      {sector.topRisks.map((r, i) => (
                        <li key={`${r}-${i}`} className="cdp-sector">
                          <span className="cdp-sector-name">
                            <i style={{ background: "#e24b57" }} />
                            {r}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="news" className="cdp-pane mt-0 space-y-4">
            <div className="cdp-table-head">
              <div className="cdp-table-title">
                <b>{t("sectorDetail.newsArticles", { count: parsedArt.length })}</b>
                <span>{t("sectorDetail.newsArticlesSub")}</span>
              </div>
            </div>
            <AppTable
              footer={
                <TablePageFooter
                  total={paging.total}
                  page={paging.page}
                  pageSize={paging.pageSize}
                  pageSizes={paging.pageSizes}
                  onPageChange={paging.setPage}
                  onPageSizeChange={paging.setPageSize}
                />
              }
            >
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sectorDetail.article")}</TableHead>
                    <TableHead>{t("common.sentiment")}</TableHead>
                    <TableHead>{t("sectorDetail.impactCol")}</TableHead>
                    <TableHead className="text-end">{t("common.confidence")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedArt.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="p-4">
                        <EmptyState title={t("sectorDetail.noArticles")} description={t("sectorDetail.noArticlesDesc")} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paging.paged.map((article) => {
                      const isExpanded = expandedArticle === article.id;
                      return (
                        <Fragment key={article.id}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/30"
                            onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                          >
                            <TableCell>
                              <p className="text-sm font-medium leading-snug">{article.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {article.source} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : t("common.nA")}
                              </p>
                            </TableCell>
                            <TableCell className={cn("font-semibold", sentimentClass(article.sentiment))}>
                              {article.sentiment || t("common.na")}
                            </TableCell>
                            <TableCell>
                              {article.impact
                                ? (IMPACT_KEYS[article.impact] ? t(IMPACT_KEYS[article.impact]) : article.impact)
                                : t("common.na")}
                            </TableCell>
                            <TableCell className="text-end font-data">
                              {article.confidence !== null ? `${article.confidence}%` : t("common.na")}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={4} className="bg-muted/20">
                                <div className="space-y-3 py-1">
                                  {article.summary && (
                                    <div>
                                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t("sectorDetail.aiSummary")}</p>
                                      <p className="text-sm leading-relaxed">{article.summary}</p>
                                    </div>
                                  )}
                                  {article.parsedDrivers.length > 0 && (
                                    <p className="text-sm text-gain">{article.parsedDrivers.join(" · ")}</p>
                                  )}
                                  {article.parsedRisks.length > 0 && (
                                    <p className="text-sm text-loss">{article.parsedRisks.join(" · ")}</p>
                                  )}
                                  {article.url && article.url.startsWith("http") && (
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#2054d0] hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {t("sectorDetail.readFull")}
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
            </AppTable>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function getConfidenceComponents(sector: SectorDetail, t: (key: string) => string) {
  const coverage = Math.min((sector.totalArticles || 0) / 10, 1) * 40;
  const sentimentDist = [sector.positiveArticles, sector.neutralArticles, sector.negativeArticles].filter((c) => c > 0);
  const agreement = sentimentDist.length > 0 ? Math.min(35, (1 - (Math.max(...sentimentDist) - Math.min(...sentimentDist)) / Math.max(sector.totalArticles, 1)) * 40) : 0;
  const impactConsistency = 8;
  const recency = 10;
  return [
    { label: t("sectorDetail.coverage"), value: Math.round(coverage), max: 40, pct: coverage },
    { label: t("sectorDetail.agreement"), value: Math.round(agreement), max: 40, pct: agreement },
    { label: t("sectorDetail.impact"), value: impactConsistency, max: 10, pct: impactConsistency * 10 },
    { label: t("sectorDetail.recency"), value: recency, max: 10, pct: recency * 10 },
  ];
}
