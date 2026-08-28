import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/AuthContext";
import { getUiPreferences, patchUiPreferences } from "@/lib/api";
import { applyBrandTheme } from "@/lib/brandTheme";

export type Density = "compact" | "default" | "comfortable";
export type ThemePref = "dark" | "light" | "system";
export type HeaderPin = "sticky" | "flow";
export type SidebarMode = "auto" | "expanded" | "collapsed";

const DENSITY_KEY = "uiDensity";
const CHROME_KEY = "qsc-chrome-prefs";
const VALID_DENSITIES: Density[] = ["compact", "default", "comfortable"];
const VALID_HEADER_PIN: HeaderPin[] = ["sticky", "flow"];
const VALID_SIDEBAR: SidebarMode[] = ["auto", "expanded", "collapsed"];

type ChromePrefs = {
  headerPin: HeaderPin;
  sidebarMode: SidebarMode;
  palette: string;
  accent: string;
  showClock: boolean;
};

const CHROME_DEFAULTS: ChromePrefs = {
  headerPin: "flow",
  sidebarMode: "auto",
  palette: "blue",
  accent: "blue",
  showClock: true,
};

function readStoredDensity(): Density {
  const stored = localStorage.getItem(DENSITY_KEY);
  return (VALID_DENSITIES as string[]).includes(stored || "") ? (stored as Density) : "default";
}

function readChrome(): ChromePrefs {
  try {
    const raw = localStorage.getItem(CHROME_KEY);
    if (!raw) return { ...CHROME_DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ChromePrefs>;
    return {
      headerPin: VALID_HEADER_PIN.includes(parsed.headerPin as HeaderPin) ? (parsed.headerPin as HeaderPin) : CHROME_DEFAULTS.headerPin,
      sidebarMode: VALID_SIDEBAR.includes(parsed.sidebarMode as SidebarMode) ? (parsed.sidebarMode as SidebarMode) : CHROME_DEFAULTS.sidebarMode,
      palette: parsed.palette || CHROME_DEFAULTS.palette,
      accent: parsed.accent || CHROME_DEFAULTS.accent,
      showClock: typeof parsed.showClock === "boolean" ? parsed.showClock : true,
    };
  } catch {
    return { ...CHROME_DEFAULTS };
  }
}

/* Apply saved brand before first paint of children */
if (typeof document !== "undefined") {
  const boot = readChrome();
  applyBrandTheme(boot.palette, boot.accent);
}

interface UiPrefsContextType {
  density: Density;
  setDensity: (density: Density) => void;
  theme: ThemePref;
  setTheme: (theme: ThemePref) => void;
  headerPin: HeaderPin;
  setHeaderPin: (value: HeaderPin) => void;
  sidebarMode: SidebarMode;
  setSidebarMode: (value: SidebarMode) => void;
  palette: string;
  setPalette: (value: string) => void;
  accent: string;
  setAccent: (value: string) => void;
  showClock: boolean;
  setShowClock: (value: boolean) => void;
  resetPrefs: () => void;
}

const UiPrefsContext = createContext<UiPrefsContextType>({
  density: "default",
  setDensity: () => {},
  theme: "dark",
  setTheme: () => {},
  headerPin: "flow",
  setHeaderPin: () => {},
  sidebarMode: "auto",
  setSidebarMode: () => {},
  palette: "blue",
  setPalette: () => {},
  accent: "blue",
  setAccent: () => {},
  showClock: true,
  setShowClock: () => {},
  resetPrefs: () => {},
});

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { theme, setTheme: setNextTheme, resolvedTheme } = useTheme();
  const [density, setDensityState] = useState<Density>(() => readStoredDensity());
  const [chrome, setChrome] = useState<ChromePrefs>(() => readChrome());
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  useEffect(() => {
    const dark =
      resolvedTheme === "dark" ||
      (!resolvedTheme && document.documentElement.classList.contains("dark"));
    applyBrandTheme(chrome.palette, chrome.accent, dark);
  }, [chrome.palette, chrome.accent, resolvedTheme]);

  const persistChrome = useCallback((next: ChromePrefs) => {
    setChrome(next);
    localStorage.setItem(CHROME_KEY, JSON.stringify(next));
    if (isAuthenticated) {
      patchUiPreferences({
        headerPin: next.headerPin,
        sidebarMode: next.sidebarMode,
        palette: next.palette,
        accent: next.accent,
        showClock: next.showClock,
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const setDensity = useCallback((next: Density) => {
    setDensityState(next);
    localStorage.setItem(DENSITY_KEY, next);
    if (isAuthenticated) patchUiPreferences({ density: next }).catch(() => {});
  }, [isAuthenticated]);

  const setTheme = useCallback((next: ThemePref) => {
    setNextTheme(next);
    if (isAuthenticated) patchUiPreferences({ theme: next }).catch(() => {});
  }, [isAuthenticated, setNextTheme]);

  const setHeaderPin = useCallback((headerPin: HeaderPin) => {
    persistChrome({ ...chrome, headerPin });
  }, [chrome, persistChrome]);

  const setSidebarMode = useCallback((sidebarMode: SidebarMode) => {
    persistChrome({ ...chrome, sidebarMode });
  }, [chrome, persistChrome]);

  const setPalette = useCallback((palette: string) => {
    persistChrome({ ...chrome, palette });
  }, [chrome, persistChrome]);

  const setAccent = useCallback((accent: string) => {
    persistChrome({ ...chrome, accent });
  }, [chrome, persistChrome]);

  const setShowClock = useCallback((showClock: boolean) => {
    persistChrome({ ...chrome, showClock });
  }, [chrome, persistChrome]);

  const resetPrefs = useCallback(() => {
    setDensity("default");
    setTheme("system");
    persistChrome({ ...CHROME_DEFAULTS });
  }, [persistChrome, setDensity, setTheme]);

  useEffect(() => {
    if (!isAuthenticated || synced) return;
    getUiPreferences()
      .then((prefs) => {
        if (prefs.density && !localStorage.getItem(DENSITY_KEY)) {
          setDensityState(prefs.density);
          localStorage.setItem(DENSITY_KEY, prefs.density);
        }
        if (prefs.theme && !localStorage.getItem("theme")) {
          setNextTheme(prefs.theme);
        }
        const stored = localStorage.getItem(CHROME_KEY);
        if (!stored) {
          const next: ChromePrefs = {
            headerPin: prefs.headerPin && VALID_HEADER_PIN.includes(prefs.headerPin) ? prefs.headerPin : CHROME_DEFAULTS.headerPin,
            sidebarMode: prefs.sidebarMode && VALID_SIDEBAR.includes(prefs.sidebarMode) ? prefs.sidebarMode : CHROME_DEFAULTS.sidebarMode,
            palette: prefs.palette || CHROME_DEFAULTS.palette,
            accent: prefs.accent || CHROME_DEFAULTS.accent,
            showClock: typeof prefs.showClock === "boolean" ? prefs.showClock : true,
          };
          setChrome(next);
          localStorage.setItem(CHROME_KEY, JSON.stringify(next));
        }
      })
      .catch(() => {})
      .finally(() => setSynced(true));
  }, [isAuthenticated, synced, setNextTheme]);

  return (
    <UiPrefsContext.Provider value={{
      density,
      setDensity,
      theme: (theme as ThemePref) || "dark",
      setTheme,
      headerPin: chrome.headerPin,
      setHeaderPin,
      sidebarMode: chrome.sidebarMode,
      setSidebarMode,
      palette: chrome.palette,
      setPalette,
      accent: chrome.accent,
      setAccent,
      showClock: chrome.showClock,
      setShowClock,
      resetPrefs,
    }}>
      {children}
    </UiPrefsContext.Provider>
  );
}

export function useUiPrefs() {
  return useContext(UiPrefsContext);
}
