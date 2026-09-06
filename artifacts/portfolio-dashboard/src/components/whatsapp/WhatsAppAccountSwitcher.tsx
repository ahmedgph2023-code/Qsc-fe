import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WhatsAppAccountStatus } from "@/lib/api";
import { metaWhatsAppApi, getWhatsAppConfigId, setWhatsAppConfigId } from "./whatsapp-api.js";
import { AddWhatsAppLabelForm } from "./AddWhatsAppNumberPopover";

function label(acc: WhatsAppAccountStatus) {
  return acc.displayPhoneNumber || acc.label || acc.phoneNumberId || "WhatsApp";
}

type Props = {
  onChanged?: () => void;
};

export function WhatsAppAccountSwitcher({ onChanged }: Props) {
  const [accounts, setAccounts] = useState<WhatsAppAccountStatus[]>([]);
  const [activeId, setActiveId] = useState(() => getWhatsAppConfigId());
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void metaWhatsAppApi.listAccounts().then(({ accounts: rows }: { accounts: WhatsAppAccountStatus[] }) => {
      setAccounts(rows || []);
      const current = getWhatsAppConfigId();
      if (!current && rows?.[0]?.id) {
        setWhatsAppConfigId(rows[0].id);
        setActiveId(rows[0].id);
      }
    });
  }, []);

  const active = accounts.find((a) => a.id === activeId) || accounts[0];

  function pick(id: string) {
    setWhatsAppConfigId(id);
    setActiveId(id);
    onChanged?.();
  }

  async function createAccount(name: string) {
    if (busy) return;
    setBusy(true);
    try {
      const created = await metaWhatsAppApi.createAccount(name);
      setWhatsAppConfigId(created.id);
      setActiveId(created.id);
      const { accounts: rows } = await metaWhatsAppApi.listAccounts();
      setAccounts(rows || []);
      setAdding(false);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setAdding(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          title={active ? label(active) : "WhatsApp numbers"}
          className="relative rounded-full text-[14px] font-bold"
        >
          {(active ? label(active) : "WA").slice(0, 2).toUpperCase()}
          <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface-elevated)] bg-[var(--color-positive)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-64">
        {accounts.map((acc) => (
          <DropdownMenuItem key={acc.id} onClick={() => pick(acc.id)}>
            <span className="truncate font-medium">{acc.label}</span>
            <span className="ms-auto text-[10px] opacity-60">{acc.enabled ? "on" : "off"}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {adding ? (
          <div className="p-2" onPointerDown={(e) => e.stopPropagation()}>
            <AddWhatsAppLabelForm
              title="Label for this WhatsApp number"
              addLabel="Add"
              cancelLabel="Cancel"
              placeholder="WhatsApp"
              busy={busy}
              onCancel={() => setAdding(false)}
              onSubmit={(name) => void createAccount(name)}
            />
          </div>
        ) : (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setAdding(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add number
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
