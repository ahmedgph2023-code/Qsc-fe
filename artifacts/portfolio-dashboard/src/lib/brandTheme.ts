/** Resolve UI preference palette/accent into CSS brand tokens on :root. */

export const BRAND_PALETTE: Record<string, string> = {
  blue: "#2c62e8",
  violet: "#7c5cfc",
  teal: "#0d9488",
  orange: "#ea580c",
  rose: "#e11d48",
  indigo: "#4338ca",
  pink: "#db2777",
  green: "#16a34a",
  gold: "#d97706",
  spectrum: "#7c3aed",
};

export const BRAND_ACCENT: Record<string, string> = {
  blue: "#2c62e8",
  violet: "#8b5cf6",
  green: "#22c55e",
  orange: "#f59e0b",
  rose: "#fb7185",
  gray: "#94a3b8",
};

const DEFAULT_MAIN = BRAND_PALETTE.blue;
const DEFAULT_ACCENT = BRAND_ACCENT.blue;

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

/** Channels for `hsl(var(--primary))` — space-separated H S% L% */
export function hexToHslChannels(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "221 70% 54%";
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function mixHex(hex: string, withWhite: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const t = clamp(withWhite);
  const r = Math.round(rgb.r + (255 - rgb.r) * t);
  const g = Math.round(rgb.g + (255 - rgb.g) * t);
  const b = Math.round(rgb.b + (255 - rgb.b) * t);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function shadeHex(hex: string, factor: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const f = clamp(factor);
  const r = Math.round(rgb.r * f);
  const g = Math.round(rgb.g * f);
  const b = Math.round(rgb.b * f);
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function toRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha)})`;
}

/** Lift brand hue slightly for dark UI readability */
function liftForDark(hex: string): string {
  return mixHex(hex, 0.18);
}

export function resolveBrandColor(
  token: string,
  map: Record<string, string>,
  fallback: string,
): string {
  if (token.startsWith("#") && parseHex(token)) return token;
  return map[token] ?? fallback;
}

export function isDocumentDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function applyBrandTheme(
  palette: string,
  accent: string,
  dark = isDocumentDark(),
) {
  const baseMain = resolveBrandColor(palette, BRAND_PALETTE, DEFAULT_MAIN);
  const baseAccent = resolveBrandColor(accent, BRAND_ACCENT, DEFAULT_ACCENT);
  const main = dark ? liftForDark(baseMain) : baseMain;
  const accentHex = dark ? liftForDark(baseAccent) : baseAccent;
  const root = document.documentElement;
  const mainHsl = hexToHslChannels(main);
  const hover = dark ? mixHex(main, 0.12) : shadeHex(baseMain, 0.82);
  const soft = dark ? toRgba(main, 0.18) : mixHex(baseMain, 0.88);
  const accentHover = dark ? mixHex(accentHex, 0.12) : shadeHex(baseAccent, 0.85);
  const accentSoft = dark ? toRgba(accentHex, 0.18) : mixHex(baseAccent, 0.88);

  root.style.setProperty("--shell-blue", main);
  root.style.setProperty("--brand", main);
  root.style.setProperty("--brand-hover", hover);
  root.style.setProperty("--brand-soft", soft);
  root.style.setProperty("--shell-accent", accentHex);

  root.style.setProperty("--primary", mainHsl);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
  root.style.setProperty("--ring", mainHsl);
  root.style.setProperty("--sidebar-primary", mainHsl);
  root.style.setProperty("--sidebar-ring", mainHsl);
  root.style.setProperty("--chart-1", mainHsl);

  root.style.setProperty("--color-primary-ink", main);
  root.style.setProperty("--color-primary-hover", hover);
  root.style.setProperty("--color-primary-soft", soft);

  root.style.setProperty("--color-accent-ink", accentHex);
  root.style.setProperty("--color-accent-hover", accentHover);
  root.style.setProperty("--color-accent-soft", accentSoft);
  root.style.setProperty("--color-info", accentHex);
  root.style.setProperty("--color-info-soft", accentSoft);

  root.dataset.palette = palette.startsWith("#") ? "custom" : palette;
  root.dataset.accent = accent.startsWith("#") ? "custom" : accent;
}
