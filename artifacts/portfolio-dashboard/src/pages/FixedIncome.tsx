import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Save, Search } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, FilterBar, EmptyState, StatTile, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { SelectField } from "@/components/phase1/SelectField";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getFiInstrument, getFiInstruments, saveFiInstrument } from "@/lib/api";

export default function FixedIncome() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const client = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["fi-instruments"], queryFn: getFiInstruments });

  const filtered = data.filter((r: any) => {
    const hay = `${r.ticker} ${r.companyName} ${r.instrumentType}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });
  const paging = useClientTablePage(filtered, search);

  const complete = data.filter((r: any) => r.fi?.termsComplete).length;
  const incomplete = data.length - complete;

  return (
    <Shell>
      <PageHeader
        title={t("fixedIncome.title")}
        description={t("fixedIncome.description")}
        meta={
          <>
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("fixedIncome.actPeriod")}
            </span>
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300">
              {t("fixedIncome.termsRequiredMeta", { count: incomplete })}
            </span>
          </>
        }
      />

      <div className="metric-strip stagger">
        <StatTile label={t("fixedIncome.instruments")} value={data.length} icon={<Landmark className="h-4 w-4" />} />
        <StatTile label={t("fixedIncome.termsComplete")} value={complete} tone="gain" />
        <StatTile label={t("fixedIncome.termsRequired")} value={incomplete} tone="warn" />
      </div>

      <FilterBar>
        <div className="relative min-w-64 flex-1">
          <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="control ps-9" placeholder={t("fixedIncome.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </FilterBar>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          title={t("fixedIncome.emptyTitle")}
          description={t("fixedIncome.emptyDesc")}
        />
      ) : (
        <AppTable footer={<ClientTableFooter paging={paging} />}>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.ticker")}</TableHead>
                <TableHead>{t("common.type")}</TableHead>
                <TableHead>{t("common.coupon")}</TableHead>
                <TableHead>{t("common.frequency")}</TableHead>
                <TableHead>{t("common.maturity")}</TableHead>
                <TableHead>{t("common.terms")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows cols={7} />
              ) : paging.paged.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-mono font-semibold">{r.ticker}</p>
                    <p className="text-xs text-muted-foreground">{r.companyName}</p>
                  </TableCell>
                  <TableCell className="capitalize">{String(r.instrumentType).replaceAll("_", " ")}</TableCell>
                  <TableCell className="font-data">{r.fi ? `${(Number(r.fi.couponRate) * 100).toFixed(2)}%` : t("common.na")}</TableCell>
                  <TableCell className="capitalize">{r.fi?.couponFrequency?.replaceAll("_", " ") || t("common.na")}</TableCell>
                  <TableCell className="font-mono text-xs">{r.fi?.maturityDate || t("common.na")}</TableCell>
                  <TableCell>
                    <span className={`mandate-chip ${r.fi?.termsComplete ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-300"}`}>
                      {r.fi?.termsComplete ? t("common.complete") : t("common.required")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setEditId(r.id)}>{t("fixedIncome.editTerms")}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </AppTable>
      )}

      {editId && (
        <FiTermsDialog
          stockId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => {
            setEditId(null);
            client.invalidateQueries({ queryKey: ["fi-instruments"] });
          }}
        />
      )}
    </Shell>
  );
}

function FiTermsDialog({ stockId, onClose, onSaved }: { stockId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ["fi-instrument", stockId], queryFn: () => getFiInstrument(stockId) });
  const [couponRate, setCouponRate] = useState("");
  const [couponFrequency, setCouponFrequency] = useState("semi_annual");
  const [issueDate, setIssueDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [facePar, setFacePar] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = data?.instrument as any;
    if (!loaded || hydrated) return;
    setCouponRate(String(Number(loaded.couponRate || 0) * 100));
    setCouponFrequency(loaded.couponFrequency || "semi_annual");
    setIssueDate(loaded.issueDate || "");
    setMaturityDate(loaded.maturityDate || "");
    setFacePar(loaded.facePar ? String(loaded.facePar) : "");
    setHydrated(true);
  }, [data, hydrated]);

  const saveMut = useMutation({
    mutationFn: () => saveFiInstrument(stockId, {
      couponRate: Number(couponRate) / 100,
      couponFrequency,
      dayCount: "ACT_PERIOD",
      issueDate: issueDate || null,
      maturityDate: maturityDate || null,
      facePar: Number(facePar) || 100,
    }),
    onSuccess: onSaved,
    onError: (e: Error) => setError(e.message),
  });

  const schedule = (data as any)?.schedule || [];
  const schedulePaging = useClientTablePage(schedule, String(schedule.length));
  const ticker = (data as any)?.stock?.ticker || t("common.stock");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("fixedIncome.instrumentTerms", { ticker })}</DialogTitle>
          <DialogDescription>
            {t("fixedIncome.dialogDesc")}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="font-mono text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid gap-4">
            {error && <p className="error-banner">{error}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("fixedIncome.couponRate")}</Label>
                <Input type="number" step="0.01" value={couponRate} onChange={(e) => setCouponRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("common.frequency")}</Label>
                <SelectField
                  className="w-full"
                  value={couponFrequency}
                  onValueChange={setCouponFrequency}
                  options={[
                    { value: "zero", label: t("fixedIncome.freqZero") },
                    { value: "semi_annual", label: t("fixedIncome.freqSemi") },
                    { value: "quarterly", label: t("fixedIncome.freqQuarterly") },
                    { value: "annual", label: t("fixedIncome.freqAnnual") },
                  ]}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("fixedIncome.issueMaturity")}</Label>
                <DateRangePicker
                  from={issueDate}
                  to={maturityDate}
                  onChange={({ from, to }) => {
                    setIssueDate(from);
                    setMaturityDate(to);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("fixedIncome.par")}</Label>
                <Input type="number" placeholder={t("fixedIncome.parPlaceholder")} value={facePar} onChange={(e) => setFacePar(e.target.value)} />
              </div>
            </div>
            <Button loading={saveMut.isPending} disabled={!maturityDate || !issueDate} onClick={() => saveMut.mutate()}>
              <Save className="h-4 w-4" />{t("fixedIncome.saveRebuild")}
            </Button>
            {schedule.length > 0 && (
              <AppTable footer={<ClientTableFooter paging={schedulePaging} />}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.period")}</TableHead>
                      <TableHead className="text-end">{t("fixedIncome.actualDays")}</TableHead>
                      <TableHead className="text-end">{t("fixedIncome.couponPer100")}</TableHead>
                      <TableHead className="text-end">{t("fixedIncome.dailyPer100")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedulePaging.paged.map((p: any) => (
                      <TableRow key={`${p.periodStart}-${p.payDate}`}>
                        <TableCell className="font-mono text-xs">{p.periodStart} → {p.periodEnd}</TableCell>
                        <TableCell className="text-end font-data">{p.actualDays}</TableCell>
                        <TableCell className="text-end font-data">{Number(p.couponPerPar).toFixed(4)}</TableCell>
                        <TableCell className="text-end font-data text-gold">{Number(p.dailyAccrualPerPar).toFixed(8)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </AppTable>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
