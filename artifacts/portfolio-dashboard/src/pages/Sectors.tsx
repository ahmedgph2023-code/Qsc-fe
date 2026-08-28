import { Shell } from "@/components/layout/Shell";
import {
  getSectors,
  fullSectorRefresh,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Newspaper,
  RefreshCw,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { EmptyState } from "@/components/phase1/PageHeader";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { HcoAssetIcon, HcoMetricCard } from "@/components/phase1/HoldingsCashOverview";
import { cn } from "@/lib/utils";

const REC_TONES: Record<string, { tone: string; valueClass: string; labelKey: string }> = {
  STRONG_BUY: { tone: "#139366", valueClass: "text-gain", labelKey: "sectors.strongBuy" },
  BUY: { tone: "#18a270", valueClass: "text-gain", labelKey: "sectors.buy" },
  HOLD: { tone: "#e98921", valueClass: "text-[#b06a14]", labelKey: "sectors.hold" },
  REDUCE: { tone: "#e24b57", valueClass: "text-loss", labelKey: "sectors.reduce" },
  EXIT: { tone: "#d12b3a", valueClass: "text-loss", labelKey: "sectors.exit" },
};

const PIPELINE_PHASE_KEYS = [
  { labelKey: "sectors.phaseFetch", pct: 33 },
  { labelKey: "sectors.phaseAnalyze", pct: 66 },
  { labelKey: "sectors.phaseScore", pct: 95 },
] as const;

function ProgressPipeline({
  running,
  done,
  result,
}: {
  running: boolean;
  done: boolean;
  result: { articlesFetched: number; articlesAnalyzed: number } | null;
}) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) {
      stopAnimation();
      if (done) {
        setProgress(100);
        setPhaseIndex(PIPELINE_PHASE_KEYS.length);
      } else {
        setProgress(0);
        setPhaseIndex(0);
      }
      return;
    }

    startRef.current = Date.now();
    let last = 0;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const totalMs = 18000;
      const rawPct = Math.min(elapsed / totalMs, 1);

      let pct = 0;
      let currentPhase = 0;
      for (let i = 0; i < PIPELINE_PHASE_KEYS.length; i++) {
        const target = PIPELINE_PHASE_KEYS[i].pct / 100;
        const start = i === 0 ? 0 : PIPELINE_PHASE_KEYS[i - 1].pct / 100;
        if (rawPct >= start) {
          const phased = Math.min((rawPct - start) / (target - start), 1);
          pct = start + phased * (target - start);
          currentPhase = i;
        }
      }
      pct = Math.round(pct * 10000) / 100;
      if (pct !== last) {
        setProgress(pct);
        setPhaseIndex(currentPhase);
        last = pct;
      }

      if (rawPct < 1 && running) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return stopAnimation;
  }, [running, done, stopAnimation]);

  const phaseLabel = done
    ? result
      ? t("sectors.pipelineCompleteDetail", { fetched: result.articlesFetched, analyzed: result.articlesAnalyzed })
      : t("sectors.pipelineComplete")
    : t(PIPELINE_PHASE_KEYS[phaseIndex]?.labelKey || PIPELINE_PHASE_KEYS[0].labelKey);

  return (
    <section className="cdp-sectors mx-0" aria-live="polite">
      <header className="cdp-sectors-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3>{t("sectors.pipelineTitle")}</h3>
          <p>{phaseLabel}</p>
        </div>
        <span className="font-data text-sm font-bold text-[#1a2b4c]">{Math.round(progress)}%</span>
      </header>
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-gain" />
        ) : running ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#2054d0]" />
        ) : null}
      </div>
      <div className="hco-progress mt-3">
        <span
          style={{
            width: `${progress}%`,
            background: done
              ? "linear-gradient(90deg, #139366cc, #139366)"
              : "linear-gradient(90deg, #3c75f3cc, #1454df)",
          }}
        />
      </div>
      <div className="mt-3 flex justify-between px-1">
        {PIPELINE_PHASE_KEYS.map((phase, i) => {
          const active = i === phaseIndex && running;
          const complete = i < phaseIndex || (i === phaseIndex && done) || (done && i <= PIPELINE_PHASE_KEYS.length - 1);
          const label = t(phase.labelKey);
          return (
            <div key={phase.labelKey} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  complete ? "bg-[#139366]" : active ? "animate-pulse bg-[#3c75f3]" : "bg-[#dfe6f6]",
                )}
              />
              <span className="max-w-[70px] text-center text-[10px] leading-tight text-muted-foreground">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Sectors() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [refreshResult, setRefreshResult] = useState<{ articlesFetched: number; articlesAnalyzed: number } | null>(null);

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: getSectors,
  });

  const refreshMutation = useMutation({
    mutationFn: fullSectorRefresh,
    onSuccess: (data) => {
      setRefreshResult({ articlesFetched: data.articlesFetched, articlesAnalyzed: data.articlesAnalyzed });
      queryClient.invalidateQueries({ queryKey: ["sectors"] });
    },
    onError: () => {
      setRefreshResult(null);
    },
  });

  const sorted = [...sectors].sort((a, b) => b.score - a.score);
  const paging = useClientTablePage(sorted, String(sorted.length));
  const constructive = sectors.filter((s) => s.recommendation === "STRONG_BUY" || s.recommendation === "BUY").length;
  const holdCount = sectors.filter((s) => s.recommendation === "HOLD").length;
  const cautious = sectors.filter((s) => s.recommendation === "REDUCE" || s.recommendation === "EXIT").length;
  const scoreSum = sorted.reduce((sum, s) => sum + Math.max(0, Number(s.score || 0)), 0);

  const recMeta = (rec: string) => {
    const cfg = REC_TONES[rec] || REC_TONES.HOLD;
    return { ...cfg, label: t(cfg.labelKey) };
  };

  return (
    <Shell>
      <div className="cdp">
        <header className="cdp-header">
          <div className="cdp-title">
            <h1>{t("sectors.title")}</h1>
            <p>{t("sectors.description")}</p>
          </div>
          <div className="cdp-header-actions">
            <Button
              className="cdp-add"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              {refreshMutation.isPending ? (
                <RefreshCw className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Newspaper className="me-2 h-4 w-4" />
              )}
              {refreshMutation.isPending ? t("sectors.fetching") : t("sectors.fetchNews")}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-[19px] sm:grid-cols-2 xl:grid-cols-4">
          <HcoMetricCard
            tone="accent"
            icon={<HcoAssetIcon src="/analytics.png" />}
            label={t("sectors.sectorsLabel")}
            value={<AnimatedNumber value={sectors.length} format="integer" loading={isLoading} />}
            note={t("sectors.coveredGroups")}
          />
          <HcoMetricCard
            tone="gain"
            icon={<HcoAssetIcon src="/growth.png" />}
            label={t("sectors.constructive")}
            value={<AnimatedNumber value={constructive} format="integer" loading={isLoading} />}
            note={t("sectors.constructiveNote")}
          />
          <HcoMetricCard
            tone="bronze"
            icon={<HcoAssetIcon src="/layers.png" />}
            label={t("sectors.hold")}
            value={<AnimatedNumber value={holdCount} format="integer" loading={isLoading} />}
            note={t("sectors.holdNote")}
          />
          <HcoMetricCard
            tone="warn"
            icon={<HcoAssetIcon src="/bank.png" />}
            label={t("sectors.cautious")}
            value={<AnimatedNumber value={cautious} format="integer" loading={isLoading} />}
            note={t("sectors.cautiousNote")}
          />
        </div>

        <div className="mt-6">
          <ProgressPipeline
            running={refreshMutation.isPending}
            done={refreshMutation.isSuccess}
            result={refreshResult}
          />
        </div>

        <div className="cdp-table-head mt-6">
          <div className="cdp-table-title">
            <b>{t("sectors.sectorViews")}</b>
            <span>{t("sectors.sectorViewsSub")}</span>
          </div>
        </div>

        {isLoading ? (
          <section className="cdp-sectors mx-0">
            <div className="space-y-3 py-4">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </section>
        ) : sectors.length === 0 ? (
          <EmptyState
            title={t("sectors.emptyTitle")}
            description={t("sectors.emptyDesc")}
            action={
              <Button className="cdp-add" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                <Newspaper className="me-2 h-4 w-4" />
                {t("sectors.fetchNews")}
              </Button>
            }
          />
        ) : (
          <>
            <section className="cdp-sectors mx-0 mb-6" aria-labelledby="sector-mix-title">
              <header className="cdp-sectors-head">
                <div>
                  <h3 id="sector-mix-title">{t("sectors.scoreMix")}</h3>
                  <p>{t("sectors.scoreMixSub")}</p>
                </div>
              </header>
              <div className="cdp-sectors-mix" aria-hidden="true">
                {sorted.map((s) => (
                  <i
                    key={s.id}
                    style={{
                      width: `${scoreSum > 0 ? (Math.max(0, Number(s.score || 0)) / scoreSum) * 100 : 0}%`,
                      background: recMeta(s.recommendation).tone,
                    }}
                  />
                ))}
              </div>
              <ul className="cdp-sectors-list">
                {sorted.map((s) => {
                  const meta = recMeta(s.recommendation);
                  const pct = Math.max(0, Math.min(100, Number(s.score || 0)));
                  return (
                    <li key={s.id} className="cdp-sector">
                      <div className="cdp-sector-top">
                        <Link href={`/sectors/${s.id}`} className="cdp-sector-name no-underline">
                          <i style={{ background: meta.tone }} />
                          {s.name}
                        </Link>
                        <span className="cdp-sector-meta">
                          <b>{meta.label}</b>
                          <em className="font-data">{pct.toFixed(0)}</em>
                        </span>
                      </div>
                      <div className="hco-progress">
                        <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.tone}cc, ${meta.tone})` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

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
                    <TableHead>{t("common.sector")}</TableHead>
                    <TableHead>{t("sectors.view")}</TableHead>
                    <TableHead className="text-end">{t("common.score")}</TableHead>
                    <TableHead className="text-end">{t("common.confidence")}</TableHead>
                    <TableHead className="text-end">{t("common.articles")}</TableHead>
                    <TableHead>{t("common.sentiment")}</TableHead>
                    <TableHead>{t("common.updated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paging.paged.map((sector) => {
                    const meta = recMeta(sector.recommendation);
                    return (
                      <TableRow key={sector.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Link href={`/sectors/${sector.id}`} className="cdp-stock">
                            <b>{sector.name}</b>
                            <span>
                              {sector.positiveDrivers.slice(0, 2).join(" · ") || sector.description || t("common.na")}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className={cn("font-semibold", meta.valueClass)}>{meta.label}</TableCell>
                        <TableCell className="text-end font-data cdp-col-price">{sector.score}</TableCell>
                        <TableCell className="text-end font-data">{sector.confidence}%</TableCell>
                        <TableCell className="text-end font-data">{sector.totalArticles}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="text-gain">{t("sectors.sentimentP", { count: sector.positiveArticles })}</span>
                          {" · "}
                          <span>{t("sectors.sentimentN", { count: sector.neutralArticles })}</span>
                          {" · "}
                          <span className="text-loss">{t("sectors.sentimentN", { count: sector.negativeArticles })}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(sector.lastUpdated).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
            </AppTable>
          </>
        )}
      </div>
    </Shell>
  );
}
