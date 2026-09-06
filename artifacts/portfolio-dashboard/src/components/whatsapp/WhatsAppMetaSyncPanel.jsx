import { useRef } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppMetaSyncPanel({
  t,
  report,
  importResult,
  syncing,
  importing,
  onSync,
  onImportFile,
}) {
  const fileRef = useRef(null);
  return (
    <div className="space-y-4 rounded-[13px] border border-[var(--shell-line)] bg-[color-mix(in_srgb,var(--color-surface-elevated)_80%,transparent)] px-[18px] py-[17px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-bold text-[var(--shell-ink)]">{t.syncFromMeta}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--shell-muted)]">{t.syncFromMetaHint}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void onSync()} disabled={syncing} loading={syncing}>
          {syncing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {t.syncFromMeta}
        </Button>
      </div>

      {report ? (
        <div className="space-y-3 text-[12px]">
          <p className="text-[11px] text-[var(--shell-muted)]">
            {t.syncLocalCounts}: {report.local?.conversations ?? 0} · {report.local?.messages ?? 0} {t.syncMessagesLabel}. {t.syncTemplatesPulled}: {report.pulled?.templates?.count ?? 0}.
          </p>
          <CapabilityList title={t.syncCanTitle} items={report.can} positive />
          <CapabilityList title={t.syncCannotTitle} items={report.cannot} />
        </div>
      ) : null}

      <div className="border-t border-[var(--shell-line)] pt-3">
        <div className="text-[12px] font-bold text-[var(--shell-ink)]">{t.syncImportJson}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--shell-muted)]">{t.syncImportHint}</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onImportFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={importing}
          loading={importing}
          onClick={() => fileRef.current?.click()}
        >
          {t.syncImportJson}
        </Button>
        {importResult ? (
          <p className="mt-2 text-[11px] text-[var(--shell-muted)]">
            {t.syncImportOk}: {importResult.inserted} new · {importResult.updated} updated · {importResult.skipped} skipped
            {importResult.contacts ? ` · ${importResult.contacts} contacts` : ""}
            {importResult.declines ? ` · ${importResult.declines} declined` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CapabilityList({ title, items, positive }) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold text-[var(--shell-ink)]">{title}</div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.key}
            className={`rounded-lg px-2.5 py-2 text-[11px] leading-relaxed ${
              positive
                ? "bg-[var(--color-positive-soft)] text-[var(--shell-ink)]"
                : "bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-[var(--shell-ink)]"
            }`}
          >
            {item.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
