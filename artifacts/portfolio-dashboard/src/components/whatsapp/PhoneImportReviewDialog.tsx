import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PhoneImportRowView = {
  row: number;
  phone: string;
  displayName: string;
  waId: string | null;
  ok: boolean;
  error: string | null;
};

type Props = {
  open: boolean;
  rows: PhoneImportRowView[];
  busy?: boolean;
  t: {
    importReviewTitle: string;
    importReviewHint: string;
    importValid: string;
    importInvalid: string;
    importColPhone: string;
    importColName: string;
    importColStatus: string;
    importSaveValid: string;
    cancel: string;
    phoneNormalized: string;
  };
  onChange: (index: number, next: { phone: string; displayName: string }) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export function PhoneImportReviewDialog({
  open,
  rows,
  busy = false,
  t,
  onChange,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;
  const valid = rows.filter((r) => r.ok).length;
  const invalid = rows.length - valid;

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center bg-[color-mix(in_srgb,var(--shell-ink)_35%,transparent)] p-4"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--shell-line)] bg-[var(--color-surface-elevated)] shadow-[0_16px_48px_rgba(20,40,80,.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[var(--shell-line)] px-5 py-4">
          <h3 className="text-[16px] font-bold text-[var(--shell-ink)]">{t.importReviewTitle}</h3>
          <p className="mt-1 text-[12px] text-[var(--shell-muted)]">{t.importReviewHint}</p>
          <p className="mt-2 text-[12px] font-semibold text-[var(--shell-ink)]">
            <span className="text-[var(--color-positive)]">
              {t.importValid}: {valid}
            </span>
            <span className="mx-2 text-[var(--shell-muted)]">·</span>
            <span className="text-[var(--color-negative)]">
              {t.importInvalid}: {invalid}
            </span>
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <div className="mb-2 hidden grid-cols-[3rem_1.2fr_1fr_7rem] gap-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[var(--shell-muted)] sm:grid">
            <div>#</div>
            <div>{t.importColPhone}</div>
            <div>{t.importColName}</div>
            <div>{t.importColStatus}</div>
          </div>
          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div
                key={`${row.row}-${index}`}
                className={`grid items-start gap-2 rounded-xl border px-3 py-2.5 sm:grid-cols-[3rem_1.2fr_1fr_7rem] ${
                  row.ok
                    ? "border-[color-mix(in_srgb,var(--color-positive)_28%,var(--shell-line))] bg-[color-mix(in_srgb,var(--color-positive-soft)_55%,var(--color-surface-elevated))]"
                    : "border-[color-mix(in_srgb,var(--color-negative)_28%,var(--shell-line))] bg-[color-mix(in_srgb,var(--color-negative-soft)_55%,var(--color-surface-elevated))]"
                }`}
              >
                <div className="pt-2 text-[12px] font-semibold text-[var(--shell-muted)]">{row.row}</div>
                <label className="block space-y-1">
                  <Input
                    dir="ltr"
                    value={row.phone}
                    onChange={(e) => onChange(index, { phone: e.target.value, displayName: row.displayName })}
                    className="w-full font-mono"
                    disabled={busy}
                  />
                  {row.ok && row.waId ? (
                    <p className="text-[11px] text-[var(--color-positive)]" dir="ltr">
                      {t.phoneNormalized}: +{row.waId}
                    </p>
                  ) : row.error ? (
                    <p className="text-[11px] text-[var(--color-negative)]">{row.error}</p>
                  ) : null}
                </label>
                <Input
                  value={row.displayName}
                  onChange={(e) => onChange(index, { phone: row.phone, displayName: e.target.value })}
                  className="w-full"
                  disabled={busy}
                />
                <div className="pt-2 text-[11px] font-bold">
                  {row.ok ? (
                    <span className="text-[var(--color-positive)]">{t.importValid}</span>
                  ) : (
                    <span className="text-[var(--color-negative)]">{t.importInvalid}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--shell-line)] px-5 py-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            {t.cancel}
          </Button>
          <Button type="button" onClick={() => void onSave()} disabled={busy || valid === 0} loading={busy}>
            {t.importSaveValid}
          </Button>
        </div>
      </div>
    </div>
  );
}
