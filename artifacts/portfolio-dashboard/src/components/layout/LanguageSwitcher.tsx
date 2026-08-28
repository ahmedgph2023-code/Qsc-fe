import { useLocale, type AppLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { SHELL_CIRCLE } from "@/components/layout/shellChrome";

const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");

export const LOCALE_LOGOS: Record<AppLocale, string> = {
  en: `${base}en-localization.png`,
  ar: `${base}ar-localization.png`,
};

export function LocaleLogo({
  locale,
  className,
  alt,
}: {
  locale: AppLocale;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={LOCALE_LOGOS[locale]}
      alt={alt ?? ""}
      draggable={false}
      className={cn("pointer-events-none select-none object-contain", className)}
    />
  );
}

/** Header control: one click toggles AR ↔ EN (no dropdown). */
export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, toggleLocale, switching, t } = useLocale();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={switching}
      onClick={() => void toggleLocale()}
      className={cn(
        SHELL_CIRCLE,
        "overflow-hidden bg-transparent p-0.5",
        compact && "size-10 min-h-10 min-w-10",
        switching && "pointer-events-none opacity-70",
        className,
      )}
      title={t("language.switchTo")}
      aria-label={t("language.switchToTarget", {
        target: t(next === "ar" ? "common.arabic" : "common.english"),
      })}
      aria-busy={switching}
    >
      <LocaleLogo
        locale={locale}
        alt={t(locale === "ar" ? "common.arabic" : "common.english")}
        className="size-full max-h-full max-w-full scale-[1.12]"
      />
    </button>
  );
}
