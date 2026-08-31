import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Full-viewport boot screen while auth session is restored on refresh. */
export function AppBootSplash({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden",
        "bg-[radial-gradient(120%_90%_at_50%_-10%,#e8effc_0%,#f4f7fc_45%,#eef2f8_100%)]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("common.loading")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(23,96,243,0.08), transparent 42%), radial-gradient(circle at 80% 70%, rgba(49,91,198,0.07), transparent 40%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-5 px-6 animate-[ipms-fade-up_0.55s_var(--ease-out,cubic-bezier(0.22,1,0.36,1))_both]">
        <div className="relative grid place-items-center">
          <span
            className="absolute size-28 rounded-full border border-[#c9d8f5]/50 animate-ping"
            style={{ animationDuration: "1.8s" }}
            aria-hidden
          />
          <span
            className="absolute size-[5.5rem] rounded-full border-2 border-[#d7e4f8] border-t-[#1760f3] animate-spin"
            style={{ animationDuration: "1.05s" }}
            aria-hidden
          />
          <div className="relative grid size-[4.25rem] place-items-center rounded-[22px] border border-white/90 bg-white/95 shadow-[0_16px_40px_rgba(57,82,143,0.16)]">
            <BrandLogo variant="mark" decorative className="h-9 w-auto object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5 text-center">
          <p className="text-[15px] font-extrabold tracking-tight text-[#0e1837]">
            {t("common.bootTitle")}
          </p>
          <p className="flex items-center gap-2 text-[13px] font-semibold text-[#687892]">
            <Spinner className="size-3.5 text-[#1760f3]" />
            <span>{t("common.bootSubtitle")}</span>
            <span className="inline-flex gap-1 ps-0.5" aria-hidden>
              <i className="size-1.5 animate-bounce rounded-full bg-[#1760f3]" style={{ animationDelay: "0ms" }} />
              <i className="size-1.5 animate-bounce rounded-full bg-[#1760f3]" style={{ animationDelay: "140ms" }} />
              <i className="size-1.5 animate-bounce rounded-full bg-[#1760f3]" style={{ animationDelay: "280ms" }} />
            </span>
          </p>
        </div>

        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-[#dce6f5]" aria-hidden>
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-[linear-gradient(90deg,#13c5ed,#1760f3,#315bc6)] opacity-90" />
        </div>
      </div>
    </div>
  );
}
