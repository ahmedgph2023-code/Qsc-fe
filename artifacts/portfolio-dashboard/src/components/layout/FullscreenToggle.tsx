import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHELL_CIRCLE } from "@/components/layout/shellChrome";

function isFullscreenActive() {
  return Boolean(document.fullscreenElement);
}

/** Header control: enter/exit browser fullscreen (full monitor width × height). */
export function FullscreenToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(isFullscreenActive());
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (isFullscreenActive()) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // User gesture / browser policy may reject; leave UI unchanged until event.
    }
  }, []);

  const label = active ? t("nav.exitFullscreen") : t("nav.enterFullscreen");

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className={cn(SHELL_CIRCLE, compact && "size-10 min-h-10 min-w-10", className)}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {active ? (
        <Minimize2 className="size-5 text-(--shell-blue)" strokeWidth={2} />
      ) : (
        <Maximize2 className="size-5 text-(--shell-blue)" strokeWidth={2} />
      )}
    </button>
  );
}
