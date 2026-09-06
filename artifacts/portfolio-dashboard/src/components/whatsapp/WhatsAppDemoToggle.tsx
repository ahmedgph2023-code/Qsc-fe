import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getWhatsAppDemoMode,
  isWhatsAppDemoToggleVisible,
  setWhatsAppDemoMode,
} from "./whatsapp-api.js";

type Props = {
  onChanged?: () => void | Promise<void>;
  /** Narrow control for the inner WhatsApp rail */
  variant?: "header" | "rail";
};

const DEMO_ICON = "/eye.png";

export function WhatsAppDemoToggle({ onChanged, variant = "header" }: Props) {
  const [demo, setDemo] = useState(() => getWhatsAppDemoMode());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setDemo(getWhatsAppDemoMode());
    window.addEventListener("qsc-whatsapp-demo-changed", sync);
    return () => window.removeEventListener("qsc-whatsapp-demo-changed", sync);
  }, []);

  if (!isWhatsAppDemoToggleVisible()) return null;

  async function toggle() {
    if (busy) return;
    const next = !getWhatsAppDemoMode();
    setBusy(true);
    setWhatsAppDemoMode(next);
    setDemo(next);
    try {
      await onChanged?.();
    } finally {
      setDemo(getWhatsAppDemoMode());
      setBusy(false);
    }
  }

  const label = demo ? "Switch to live" : "Show demo preview";

  return (
    <Button
      type="button"
      variant={demo ? "soft" : "ghost"}
      size="icon"
      onClick={() => void toggle()}
      disabled={busy}
      title={label}
      aria-label={label}
      aria-pressed={demo}
      className={variant === "rail" ? "h-14 w-14 min-h-14 min-w-14 rounded-[16px]" : undefined}
    >
      <img src={DEMO_ICON} alt="" className={variant === "rail" ? "h-12 w-12 object-contain" : "h-8 w-8 object-contain"} />
    </Button>
  );
}
