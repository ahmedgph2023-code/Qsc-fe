import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { metaWhatsAppApi, setWhatsAppConfigId } from "./whatsapp-api.js";

type CreatedAccount = { id?: string } & Record<string, unknown>;

type FormProps = {
  title: string;
  addLabel: string;
  cancelLabel: string;
  placeholder?: string;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void | Promise<void>;
};

export function AddWhatsAppLabelForm({
  title,
  addLabel,
  cancelLabel,
  placeholder = "WhatsApp",
  busy = false,
  onCancel,
  onSubmit,
}: FormProps) {
  const [name, setName] = useState(placeholder);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(name.trim() || placeholder);
      }}
    >
      <p className="text-[12px] font-semibold text-[var(--shell-ink)]">{title}</p>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={busy}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button type="submit" size="sm" loading={busy}>
          {addLabel}
        </Button>
      </div>
    </form>
  );
}

type PopoverProps = {
  children: ReactNode;
  title: string;
  addLabel: string;
  cancelLabel: string;
  placeholder?: string;
  align?: "start" | "center" | "end";
  onCreated?: (created: CreatedAccount) => void | Promise<void>;
  onError?: (err: unknown) => void;
};

export function AddWhatsAppNumberPopover({
  children,
  title,
  addLabel,
  cancelLabel,
  placeholder = "WhatsApp",
  align = "end",
  onCreated,
  onError,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(name: string) {
    if (busy) return;
    setBusy(true);
    try {
      const created = (await metaWhatsAppApi.createAccount(name)) as CreatedAccount;
      if (created?.id) setWhatsAppConfigId(created.id);
      setOpen(false);
      await onCreated?.(created);
    } catch (err) {
      onError?.(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} sideOffset={8} className="w-72 p-4">
        <AddWhatsAppLabelForm
          title={title}
          addLabel={addLabel}
          cancelLabel={cancelLabel}
          placeholder={placeholder}
          busy={busy}
          onCancel={() => setOpen(false)}
          onSubmit={submit}
        />
      </PopoverContent>
    </Popover>
  );
}
