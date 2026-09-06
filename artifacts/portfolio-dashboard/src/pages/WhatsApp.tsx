import { Redirect } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { useAuth } from "@/lib/AuthContext";
import { canAccessPath } from "@/lib/access";
import WhatsAppWorkspace from "@/components/whatsapp/WhatsAppWorkspace.jsx";

export default function WhatsAppPage() {
  const { role, username } = useAuth();
  const allowed = canAccessPath("/whatsapp", { role, username });

  if (!allowed) return <Redirect to="/" />;

  return (
    <Shell>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-(--shell-line) bg-[var(--color-surface-elevated)] shadow-(--shell-shadow)">
        <WhatsAppWorkspace />
      </div>
    </Shell>
  );
}
