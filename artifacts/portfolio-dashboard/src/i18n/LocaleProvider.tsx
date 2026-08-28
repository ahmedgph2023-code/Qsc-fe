import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { DirectionProvider } from "@radix-ui/react-direction";
import { Loader2 } from "lucide-react";
import i18n, {
  appDir,
  applyDocumentLocale,
  isAppLocale,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  DEFAULT_LOCALE,
} from "@/i18n";

export type { AppLocale };

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  switching: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  ready: boolean;
  dir: "rtl" | "ltr";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const MIN_OVERLAY_MS = 480;

function LocaleSwitchOverlay({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] grid place-items-center bg-[color-mix(in_srgb,#0b1220_42%,transparent)] backdrop-blur-[6px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-3 rounded-[22px] border border-white/90 bg-[linear-gradient(160deg,#ffffff_0%,#f3f6ff_100%)] px-8 py-7 shadow-[0_22px_48px_rgba(20,40,90,0.28)]">
        <Loader2 className="size-9 animate-spin text-[#245ee8]" aria-hidden />
        <p className="text-[13px] font-semibold tracking-tight text-[#1a2b4c]">{label}</p>
      </div>
    </div>
  );
}

function LocaleController({ children }: { children: ReactNode }) {
  const { i18n: instance, t, ready } = useTranslation();
  const [switching, setSwitching] = useState(false);
  const locale = (isAppLocale(instance.language) ? instance.language : DEFAULT_LOCALE) as AppLocale;

  const setLocale = useCallback(
    async (next: AppLocale) => {
      if (next === locale || switching) return;
      setSwitching(true);
      // Let the overlay paint before dir/font thrash.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const started = performance.now();
      try {
        await instance.changeLanguage(next);
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        applyDocumentLocale(next);
      } finally {
        const elapsed = performance.now() - started;
        const remain = Math.max(0, MIN_OVERLAY_MS - elapsed);
        if (remain > 0) await new Promise((r) => setTimeout(r, remain));
        // One more beat so layout/fonts settle under the overlay.
        await new Promise((r) => setTimeout(r, 60));
        setSwitching(false);
      }
    },
    [instance, locale, switching],
  );

  const toggleLocale = useCallback(async () => {
    await setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      switching,
      t,
      ready,
      dir: appDir(locale),
    }),
    [locale, setLocale, toggleLocale, switching, t, ready],
  );

  return (
    <LocaleContext.Provider value={value}>
      <DirectionProvider dir={value.dir}>{children}</DirectionProvider>
      {switching ? <LocaleSwitchOverlay label={t("language.switching")} /> : null}
    </LocaleContext.Provider>
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleController>{children}</LocaleController>
    </I18nextProvider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
