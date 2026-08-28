import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

export const LOCALES = ["en", "ar"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_STORAGE_KEY = "qsc-locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "ar";
}

export function readStoredLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function appDir(locale?: string | null): "rtl" | "ltr" {
  return locale === "ar" || locale?.startsWith("ar") ? "rtl" : "ltr";
}

export function applyDocumentLocale(locale: AppLocale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = appDir(locale);
  root.dataset.locale = locale;
  const isAr = locale === "ar";
  root.style.fontFamily = isAr
    ? '"Cairo", "Alexandria", ui-sans-serif, system-ui, sans-serif'
    : '"IBM Plex Sans", "Cairo", ui-sans-serif, system-ui, sans-serif';
  /* Latin negative tracking fights Arabic joining — keep natural spacing in AR */
  root.style.letterSpacing = isAr ? "normal" : "";
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: typeof document !== "undefined" ? readStoredLocale() : DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
});

if (typeof document !== "undefined") {
  applyDocumentLocale(readStoredLocale());
}

export default i18n;
