import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Redirect } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/layout/Shell";
import { PageHeader, EmptyState } from "@/components/phase1/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { SelectField } from "@/components/phase1/SelectField";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin } from "@/lib/superAdmin";
import {
  getSystemConfig, updateSystemIps, updateSystemSetting,
  listSystemUniverse, updateSystemUniverseStock, refreshSystemIlliquid,
} from "@/lib/api";
import { OfficialClosesPanel } from "@/components/phase1/OfficialClosesPanel";
import { cn } from "@/lib/utils";

type Tab = "ips" | "flags" | "halal" | "prices";

export default function SystemConfigPage() {
  const { t } = useTranslation();
  const { username } = useAuth();
  const [tab, setTab] = useState<Tab>("ips");
  if (!isSuperAdmin(username)) return <Redirect to="/" />;

  return (
    <Shell>
      <PageHeader
        title={t("systemConfig.title")}
        description={t("systemConfig.description")}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["ips", "systemConfig.tabIps"],
          ["flags", "systemConfig.tabFlags"],
          ["halal", "systemConfig.tabHalal"],
          ["prices", "systemConfig.tabPrices"],
        ] as const).map(([id, labelKey]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>
      {tab === "ips" && <IpsPanel />}
      {tab === "flags" && <FlagsPanel />}
      {tab === "halal" && <HalalPanel />}
      {tab === "prices" && <OfficialClosesPanel />}
    </Shell>
  );
}

function IpsPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["system-config"], queryFn: getSystemConfig });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const ipsRows = data?.ipsLimits ?? [];
  const paging = useClientTablePage(ipsRows, String(ipsRows.length));
  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateSystemIps(key, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-config"] }),
  });
  const refresh = useMutation({
    mutationFn: refreshSystemIlliquid,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-universe"] });
      qc.invalidateQueries({ queryKey: ["stocks"] });
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{data?.note}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {t("systemConfig.recomputeIlliquid")}
        </Button>
        {refresh.data && (
          <span className="text-xs text-muted-foreground">
            {t("systemConfig.refreshResult", {
              threshold: String((refresh.data as { threshold?: number }).threshold),
              updated: String((refresh.data as { stocksUpdated?: number }).stocksUpdated),
            })}
          </span>
        )}
      </div>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.key")}</TableHead>
              <TableHead>{t("common.descriptionLabel")}</TableHead>
              <TableHead>{t("common.unit")}</TableHead>
              <TableHead className="w-36">{t("common.value")}</TableHead>
              <TableHead className="text-end">{t("common.save")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((row) => {
              const val = drafts[row.key] ?? row.value;
              return (
                <TableRow key={row.key}>
                  <TableCell className="font-data text-xs">{row.key}</TableCell>
                  <TableCell className="text-sm">{row.description}</TableCell>
                  <TableCell><Badge variant="outline">{row.unit}</Badge></TableCell>
                  <TableCell>
                    <Input
                      value={val}
                      onChange={(e) => setDrafts((d) => ({ ...d, [row.key]: e.target.value }))}
                      className="font-data"
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      size="sm"
                      disabled={val === row.value || save.isPending}
                      onClick={() => save.mutate({ key: row.key, value: val })}
                    >
                      {t("common.save")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
      </AppTable>
      {save.isError && <p className="text-sm text-loss">{(save.error as Error).message}</p>}
    </div>
  );
}

function FlagsPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["system-config"], queryFn: getSystemConfig });
  const flagRows = data?.settings ?? [];
  const paging = useClientTablePage(flagRows, String(flagRows.length));
  const save = useMutation({
    mutationFn: (body: { key: string; value: string | boolean; confirmed?: boolean }) =>
      updateSystemSetting(body.key, { value: body.value, confirmed: body.confirmed }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-config"] }),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("systemConfig.flagsIntro")}
      </p>
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.setting")}</TableHead>
              <TableHead>{t("common.category")}</TableHead>
              <TableHead>{t("common.value")}</TableHead>
              <TableHead>{t("common.confirmed")}</TableHead>
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((s) => (
              <TableRow key={s.key}>
                <TableCell>
                  <div className="font-data text-xs">{s.key}</div>
                  <div className="mt-1 max-w-md text-xs text-muted-foreground">{s.description}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{s.category}</Badge></TableCell>
                <TableCell>
                  {s.valueType === "boolean" ? (
                    <Badge className={cn(s.value === "true" && "bg-[var(--color-positive)]")}>{s.value}</Badge>
                  ) : (
                    <span className="font-data text-sm">{s.value}</span>
                  )}
                </TableCell>
                <TableCell>{s.confirmed ? t("common.yes") : t("common.draft")}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  {s.valueType === "boolean" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => save.mutate({ key: s.key, value: s.value !== "true" })}
                    >
                      {t("common.toggle")}
                    </Button>
                  )}
                  {!s.confirmed && (
                    <Button
                      size="sm"
                      onClick={() => save.mutate({ key: s.key, value: s.value, confirmed: true })}
                    >
                      {t("common.confirm")}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
      {save.isError && <p className="text-sm text-loss">{(save.error as Error).message}</p>}
    </div>
  );
}

function HalalPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["system-universe"], queryFn: listSystemUniverse });
  const save = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateSystemUniverseStock(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system-universe"] });
      qc.invalidateQueries({ queryKey: ["stocks"] });
      qc.invalidateQueries({ queryKey: ["approved-list"] });
    },
  });

  const rows = useMemo(() => {
    let list = data?.data ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.ticker.toLowerCase().includes(q) || r.companyName.toLowerCase().includes(q));
    }
    if (filter === "halal") list = list.filter((r) => r.shariahGroup === "shariah");
    if (filter === "not") list = list.filter((r) => r.shariahGroup === "not_shariah");
    if (filter === "unclassified") list = list.filter((r) => !r.shariahGroup);
    return list;
  }, [data, search, filter]);
  const paging = useClientTablePage(rows, `${search}|${filter}`);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("systemConfig.halalIntro")}
      </p>
      <div className="flex flex-wrap gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("systemConfig.searchTicker")} className="max-w-xs" />
        <SelectField
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: t("common.all") },
            { value: "halal", label: t("systemConfig.filterHalal") },
            { value: "not", label: t("systemConfig.filterNot") },
            { value: "unclassified", label: t("systemConfig.filterUnclassified") },
          ]}
        />
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">{t("systemConfig.loadingUniverse")}</p>}
      <AppTable footer={<ClientTableFooter paging={paging} />}>
        <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.sector")}</TableHead>
              <TableHead>{t("common.shariah")}</TableHead>
              <TableHead>{t("systemConfig.approved")}</TableHead>
              <TableHead>{t("systemConfig.illiquid")}</TableHead>
              <TableHead className="text-end">{t("common.set")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState title={t("systemConfig.emptyStocksTitle")} description={t("systemConfig.emptyStocksDesc")} />
                </TableCell>
              </TableRow>
            ) : paging.paged.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.ticker}</div>
                  <div className="text-xs text-muted-foreground">{r.companyName}</div>
                </TableCell>
                <TableCell className="text-sm">{r.sector}</TableCell>
                <TableCell>
                  <Badge variant={r.shariahGroup === "shariah" ? "default" : "outline"}>
                    {r.shariahGroup ?? t("systemConfig.unclassified")}
                  </Badge>
                </TableCell>
                <TableCell><Badge variant="outline">{r.approvedListStatus}</Badge></TableCell>
                <TableCell>{r.isIlliquid ? t("common.yes") : t("common.no")}</TableCell>
                <TableCell className="space-x-1 rtl:space-x-reverse text-end">
                  <Button
                    size="sm"
                    variant={r.shariahGroup === "shariah" ? "default" : "outline"}
                    onClick={() => save.mutate({ id: r.id, body: { shariahGroup: "shariah" } })}
                  >
                    {t("systemConfig.halal")}
                  </Button>
                  <Button
                    size="sm"
                    variant={r.shariahGroup === "not_shariah" ? "default" : "outline"}
                    onClick={() => save.mutate({ id: r.id, body: { shariahGroup: "not_shariah" } })}
                  >
                    {t("systemConfig.not")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => save.mutate({ id: r.id, body: { approvedListStatus: "approved_buy" } })}
                  >
                    {t("systemConfig.approveBuy")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => save.mutate({ id: r.id, body: { isIlliquid: !r.isIlliquid } })}
                  >
                    {t("systemConfig.illiquid")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </AppTable>
      {save.isError && <p className="text-sm text-loss">{(save.error as Error).message}</p>}
    </div>
  );
}
