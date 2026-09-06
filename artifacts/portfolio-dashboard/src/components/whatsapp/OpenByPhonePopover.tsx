import { useState, type FormEvent, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  children: ReactNode;
  t: {
    openPhone: string;
    phoneHint: string;
    phonePlaceholder: string;
    phoneRequired: string;
    phoneInvalid: string;
    phoneNormalized: string;
    displayNameOptional: string;
    cancel: string;
    open: string;
  };
  normalizePhone: (value: string) => string | null;
  busy?: boolean;
  align?: "start" | "center" | "end";
  onOpen: (phone: string, displayName: string) => void | boolean | Promise<void | boolean>;
};

export function OpenByPhonePopover({
  children,
  t,
  normalizePhone,
  busy = false,
  align = "end",
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = normalizePhone(phone);
  const showError = touched ? error : null;

  function reset() {
    setPhone("");
    setName("");
    setTouched(false);
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const raw = phone.trim();
    if (!raw) {
      setError(t.phoneRequired);
      return;
    }
    const waId = normalizePhone(raw);
    if (!waId) {
      setError(t.phoneInvalid);
      return;
    }
    setError(null);
    const ok = await onOpen(waId, name.trim());
    if (ok === false) return;
    setOpen(false);
    reset();
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} className="w-[320px] p-4">
        <form className="space-y-3" onSubmit={(e) => void submit(e)}>
          <h3 className="text-[14px] font-bold text-[var(--shell-ink)]">{t.openPhone}</h3>
          <p className="text-[12px] leading-5 text-[var(--shell-muted)]">{t.phoneHint}</p>
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[var(--shell-muted)]">{t.openPhone}</span>
            <Input
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (touched) {
                  const next = e.target.value.trim();
                  if (!next) setError(t.phoneRequired);
                  else if (!normalizePhone(next)) setError(t.phoneInvalid);
                  else setError(null);
                }
              }}
              onBlur={() => setTouched(true)}
              placeholder={t.phonePlaceholder}
              aria-invalid={Boolean(showError)}
              className={`w-full ${showError ? "border-[var(--color-negative)]" : ""}`}
              autoFocus
              disabled={busy}
            />
          </label>
          {parsed && !showError ? (
            <p className="text-[12px] text-[var(--color-positive)]" dir="ltr">
              {t.phoneNormalized}: +{parsed}
            </p>
          ) : null}
          {showError ? <p className="text-[12px] text-[var(--color-negative)]">{showError}</p> : null}
          <label className="block space-y-1.5">
            <span className="text-[12px] font-medium text-[var(--shell-muted)]">{t.displayNameOptional}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="w-full" disabled={busy} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button type="submit" size="sm" loading={busy}>
              {t.open}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
