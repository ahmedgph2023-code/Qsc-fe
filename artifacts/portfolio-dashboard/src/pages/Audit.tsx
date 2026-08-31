import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Redirect } from "wouter";
import { PageHeader, FilterBar, EmptyState, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { SelectField } from "@/components/phase1/SelectField";
import { Input } from "@/components/ui/input";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, useClientTablePage } from "@/components/phase1/DataTableCard";
import { TablePageFooter } from "@/components/phase1/TablePageFooter";
import { getAuditHealth, getAuditLogs } from "@/lib/api";

function JsonDiff({ oldValue, newValue }: { oldValue?: unknown; newValue?: unknown }) {
  const { t } = useTranslation();
  if (oldValue == null && newValue == null) return <p className="text-xs text-muted-foreground">{t("audit.noPayload")}</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">{t("audit.before")}</p>
        <pre className="max-h-48 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] font-mono">
          {oldValue == null ? t("common.na") : JSON.stringify(oldValue, null, 2)}
        </pre>
      </div>
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">{t("audit.after")}</p>
        <pre className="max-h-48 overflow-auto rounded-lg border border-border/60 bg-muted/30 p-3 text-[11px] font-mono">
          {newValue == null ? t("common.na") : JSON.stringify(newValue, null, 2)}
        </pre>
      </div>
    </div>
  );
}

/** Audit trail body — used inside Users admin tabs (no Shell). */
export function AuditPanel({ showHeader = true }: { showHeader?: boolean }) {
  const { t } = useTranslation();
  const [objectType, setObjectType] = useState("");
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data: health } = useQuery({ queryKey: ["audit-health"], queryFn: getAuditHealth });
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit", objectType, action],
    queryFn: () => getAuditLogs({ objectType, action }),
  });
  const paging = useClientTablePage(logs, `${objectType}|${action}`);

  return (
    <>
      {showHeader ? (
        <PageHeader
          title={t("audit.title")}
          description={t("audit.description")}
          meta={
            <span className="rounded-md border border-border/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("common.eventsCount", { count: logs.length })}
            </span>
          }
        />
      ) : null}

      <StatsSummaryBar
        className="mb-6"
        ariaLabel={t("audit.title")}
        items={[
          {
            id: "db",
            icon: "/security.png",
            label: t("audit.database"),
            value: health?.dbOk ? t("audit.operational") : t("audit.unavailable"),
            hint: "",
            valueClassName: health?.dbOk ? "text-[var(--color-positive)]" : "text-loss",
          },
          {
            id: "market",
            icon: "/calendar.png",
            label: t("audit.lastMarketDate"),
            value: health?.lastPriceDate || t("audit.noData"),
            hint: "",
          },
          {
            id: "ai",
            icon: "/info.png",
            label: t("audit.aiPolicy"),
            value: health?.aiPolicy || t("common.loading"),
            hint: "",
          },
          {
            id: "events",
            icon: "/documents.png",
            label: t("audit.visibleEvents"),
            value: <AnimatedNumber value={logs.length} format="integer" />,
            hint: "",
          },
        ]}
      />

      <FilterBar>
        <Input className="control max-w-xs" placeholder={t("audit.objectTypePlaceholder")} value={objectType} onChange={(e) => setObjectType(e.target.value)} />
        <SelectField
          className="w-48"
          value={action}
          onValueChange={setAction}
          aria-label={t("common.actions")}
          options={[
            { value: "", label: t("common.allActions") },
            { value: "create", label: t("common.create") },
            { value: "update", label: t("common.update") },
            { value: "approve", label: t("common.approve") },
            { value: "status_change", label: t("audit.statusChange") },
            { value: "override", label: t("audit.override") },
            { value: "delete", label: t("common.delete") },
            { value: "reject", label: t("common.reject") },
          ]}
        />
      </FilterBar>

      {!isLoading && !logs.length ? (
        <EmptyState
          title={t("audit.emptyTitle")}
          description={t("audit.emptyDesc")}
        />
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
                <TableHead className="w-8" />
                <TableHead>{t("audit.occurred")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
                <TableHead>{t("audit.object")}</TableHead>
                <TableHead>{t("audit.user")}</TableHead>
                <TableHead>{t("audit.reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows cols={6} />
              ) : paging.paged.map((l: any) => {
                const open = expanded === l.id;
                return (
                  <Fragment key={l.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(open ? null : l.id)}>
                      <TableCell>{open ? <ChevronDown className="h-4 w-4 text-gold" /> : <ChevronRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />}</TableCell>
                      <TableCell className="font-mono text-xs">{new Date(l.occurredAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="rounded border border-gold/20 bg-gold/5 px-2 py-1 font-mono text-xs uppercase text-gold">{l.action}</span>
                      </TableCell>
                      <TableCell>
                        <p>{l.objectType}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{l.objectId || t("common.na")}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{l.userId?.slice(0, 12) || t("audit.system")}</TableCell>
                      <TableCell className="max-w-sm text-muted-foreground">{l.reason || t("common.na")}</TableCell>
                    </TableRow>
                    {open && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/10 p-4">
                          <JsonDiff oldValue={l.oldValue} newValue={l.newValue} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
        </AppTable>
      )}
    </>
  );
}

/** Legacy `/audit` URL → Users admin (Audit tab). */
export default function Audit() {
  return <Redirect to="/users?tab=audit" />;
}
