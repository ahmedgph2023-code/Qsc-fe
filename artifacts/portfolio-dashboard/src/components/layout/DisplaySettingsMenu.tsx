import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Sun, Moon, Laptop, AlignJustify, Rows3, LayoutGrid,
  Pin, MoveVertical, PanelLeftOpen, PanelLeftClose, PanelLeft,
  MoreHorizontal, Clock, Check, RotateCcw, Lightbulb, Languages,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUiPrefs, type Density, type HeaderPin, type SidebarMode, type ThemePref } from "@/lib/UiPrefsContext";
import { useLocale, type AppLocale } from "@/i18n/LocaleProvider";
import { LocaleLogo } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { SHELL_ACTION_ICON, SHELL_CIRCLE, SHELL_CIRCLE_OPEN } from "@/components/layout/shellChrome";

const THEME_OPTIONS: { value: ThemePref; labelKey: string; hintKey: string; icon: typeof Sun }[] = [
  { value: "light", labelKey: "settings.light", hintKey: "settings.lightHint", icon: Sun },
  { value: "dark", labelKey: "settings.dark", hintKey: "settings.darkHint", icon: Moon },
  { value: "system", labelKey: "settings.system", hintKey: "settings.systemHint", icon: Laptop },
];

const DENSITY_OPTIONS: { value: Density; labelKey: string; hintKey: string; icon: typeof Rows3 }[] = [
  { value: "compact", labelKey: "settings.compact", hintKey: "settings.compactHint", icon: AlignJustify },
  { value: "default", labelKey: "settings.default", hintKey: "settings.defaultHint", icon: Rows3 },
  { value: "comfortable", labelKey: "settings.comfortable", hintKey: "settings.comfortableHint", icon: LayoutGrid },
];

const HEADER_OPTIONS: { value: HeaderPin; labelKey: string; hintKey: string; icon: typeof Pin }[] = [
  { value: "sticky", labelKey: "settings.pinHeader", hintKey: "settings.pinHeaderHint", icon: Pin },
  { value: "flow", labelKey: "settings.scrollWithPage", hintKey: "settings.scrollWithPageHint", icon: MoveVertical },
];

const SIDEBAR_OPTIONS: { value: SidebarMode; labelKey: string; hintKey: string; icon: typeof PanelLeft }[] = [
  { value: "expanded", labelKey: "settings.alwaysExpanded", hintKey: "settings.alwaysExpandedHint", icon: PanelLeftOpen },
  { value: "collapsed", labelKey: "settings.alwaysCollapsed", hintKey: "settings.alwaysCollapsedHint", icon: PanelLeftClose },
  { value: "auto", labelKey: "settings.autoDefault", hintKey: "settings.autoDefaultHint", icon: PanelLeft },
];

const LANGUAGE_OPTIONS: { value: AppLocale; labelKey: string; hintKey: string }[] = [
  { value: "en", labelKey: "common.english", hintKey: "settings.languageHint" },
  { value: "ar", labelKey: "common.arabic", hintKey: "settings.languageHint" },
];

const PALETTES = [
  { id: "blue", color: "#2c62e8" },
  { id: "violet", color: "#7c5cfc" },
  { id: "teal", color: "#14b8a6" },
  { id: "orange", color: "#f97316" },
  { id: "rose", color: "#f43f5e" },
  { id: "indigo", color: "#3730a3" },
  { id: "pink", color: "#ec4899" },
  { id: "green", color: "#22c55e" },
  { id: "gold", color: "#d97706" },
  { id: "spectrum", color: "conic-gradient(from 90deg, #60a5fa, #a78bfa, #f472b6, #fb923c, #facc15, #4ade80, #22d3ee, #60a5fa)" },
];

const ACCENTS = [
  { id: "blue", color: "#2c62e8" },
  { id: "violet", color: "#8b5cf6" },
  { id: "green", color: "#22c55e" },
  { id: "orange", color: "#f59e0b" },
  { id: "rose", color: "#fb7185" },
  { id: "gray", color: "#94a3b8" },
];

function Choice({
  selected,
  icon,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={cn("prefs-choice", selected && "is-on")} onClick={onClick}>
      <span className="prefs-choice-icon">{icon}</span>
      <span className="min-w-0 flex-1 text-start">
        <b>{title}</b>
        <span className="prefs-choice-hint">{hint}</span>
      </span>
      <span className={cn("prefs-check", selected && "is-on")}>
        {selected ? <Check /> : null}
      </span>
    </button>
  );
}

function Swatch({
  id,
  color,
  selected,
  onSelect,
  label,
}: {
  id: string;
  color: string;
  selected: boolean;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn("prefs-swatch", selected && "is-on")}
      style={{ background: color }}
      aria-label={label}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
    >
      {selected ? <Check /> : null}
    </button>
  );
}

export function DisplaySettingsMenu({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const {
    theme, setTheme, density, setDensity,
    headerPin, setHeaderPin, sidebarMode, setSidebarMode,
    palette, setPalette, accent, setAccent,
    showClock, setShowClock, resetPrefs,
  } = useUiPrefs();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const customRef = useRef<HTMLInputElement>(null);
  const customAccent = accent.startsWith("#");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(SHELL_CIRCLE, triggerClassName, open && SHELL_CIRCLE_OPEN)}
          title={t("settings.trigger")}
          aria-label={t("settings.triggerAria")}
        >
          <img src="/setting-2.png" alt="" className={SHELL_ACTION_ICON} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={12}
        className="prefs-popover z-[80] w-[min(640px,calc(100vw-24px))] p-0"
      >
        <div className="prefs-panel">
          <div className="prefs-head">
            <span className="prefs-head-icon" aria-hidden>
              <img src="/setting.png" alt="" />
            </span>
            <div>
              <b>{t("settings.title")}</b>
              <span>{t("settings.subtitle")}</span>
            </div>
          </div>
          <div className="prefs-grid">
            <div className="prefs-col prefs-card">
              <p className="prefs-kicker"><Languages className="h-3.5 w-3.5" /> {t("settings.language")}</p>
              <p className="prefs-caption">{t("settings.languageHint")}</p>
              <div className="prefs-stack">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.value}
                    selected={locale === opt.value}
                    icon={
                      <span className="grid size-7 place-items-center overflow-hidden rounded-md bg-transparent p-0">
                        <LocaleLogo locale={opt.value} className="size-full object-contain" />
                      </span>
                    }
                    title={t(opt.labelKey)}
                    hint={opt.value === "ar" ? "العربية · RTL" : "English · LTR"}
                    onClick={() => void setLocale(opt.value)}
                  />
                ))}
              </div>

              <p className="prefs-kicker"><Sun className="h-3.5 w-3.5" /> {t("settings.theme")}</p>
              <div className="prefs-stack">
                {THEME_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.value}
                    selected={theme === opt.value}
                    icon={<opt.icon className="h-3.5 w-3.5" />}
                    title={t(opt.labelKey)}
                    hint={t(opt.hintKey)}
                    onClick={() => setTheme(opt.value)}
                  />
                ))}
              </div>

              <p className="prefs-kicker"><Rows3 className="h-3.5 w-3.5" /> {t("settings.numberSize")}</p>
              <div className="prefs-stack">
                {DENSITY_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.value}
                    selected={density === opt.value}
                    icon={<opt.icon className="h-3.5 w-3.5" />}
                    title={t(opt.labelKey)}
                    hint={t(opt.hintKey)}
                    onClick={() => setDensity(opt.value)}
                  />
                ))}
              </div>
            </div>

            <div className="prefs-col prefs-card">
              <p className="prefs-kicker">{t("settings.mainColor")}</p>
              <div className="prefs-swatches">
                {PALETTES.map((p) => (
                  <Swatch
                    key={p.id}
                    id={p.id}
                    color={p.color}
                    selected={palette === p.id}
                    onSelect={setPalette}
                    label={`${p.id} ${t("settings.mainColor")}`}
                  />
                ))}
              </div>
              <p className="prefs-caption">{t("settings.mainApplies")}</p>
              <div className="prefs-preview-chart" data-palette={palette}>
                <div className="prefs-preview-sidebar" />
                <div className="prefs-preview-body">
                  <span />
                  <span />
                  <span />
                  <div className="prefs-preview-line" />
                </div>
                <div className="prefs-preview-bars">
                  <i /><i /><i /><i />
                </div>
              </div>

              <p className="prefs-kicker">{t("settings.accentColor")}</p>
              <div className="prefs-swatches">
                {ACCENTS.map((p) => (
                  <Swatch
                    key={p.id}
                    id={p.id}
                    color={p.color}
                    selected={!customAccent && accent === p.id}
                    onSelect={setAccent}
                    label={`${p.id} ${t("settings.accentColor")}`}
                  />
                ))}
                <button
                  type="button"
                  className={cn("prefs-swatch is-custom", customAccent && "is-on")}
                  onClick={() => customRef.current?.click()}
                  aria-label={t("settings.customAccent")}
                >
                  +
                </button>
                <input
                  ref={customRef}
                  type="color"
                  className="sr-only"
                  value={customAccent ? accent : "#2c62e8"}
                  onChange={(e) => setAccent(e.target.value)}
                  tabIndex={-1}
                  aria-hidden
                />
                <span className="prefs-swatch-label">{t("settings.custom")}</span>
              </div>

              <p className="prefs-kicker">{t("settings.preview")}</p>
              <div className="prefs-kpi">
                <span className="prefs-kpi-mark"><Rows3 /></span>
                <span className="prefs-kpi-ghost"><i /><i /></span>
                <strong>{t("settings.qarPreview")}</strong>
                <em>+1.22%</em>
              </div>
            </div>
          </div>

          <div className="prefs-grid prefs-grid-sub">
            <div className="prefs-col prefs-card">
              <p className="prefs-kicker"><Pin className="h-3.5 w-3.5" /> {t("settings.headerPrefs")}</p>
              <div className="prefs-stack">
                {HEADER_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.value}
                    selected={headerPin === opt.value}
                    icon={<opt.icon className="h-3.5 w-3.5" />}
                    title={t(opt.labelKey)}
                    hint={t(opt.hintKey)}
                    onClick={() => setHeaderPin(opt.value)}
                  />
                ))}
              </div>
            </div>
            <div className="prefs-col prefs-card">
              <p className="prefs-kicker"><PanelLeft className="h-3.5 w-3.5" /> {t("settings.sidebarPrefs")}</p>
              <div className="prefs-stack">
                {SIDEBAR_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.value}
                    selected={sidebarMode === opt.value}
                    icon={<opt.icon className="h-3.5 w-3.5" />}
                    title={t(opt.labelKey)}
                    hint={t(opt.hintKey)}
                    onClick={() => setSidebarMode(opt.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <button type="button" className="prefs-more" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
            <MoreHorizontal className="h-3.5 w-3.5" />
            {t("settings.moreOptions")}
          </button>
          {moreOpen ? (
            <div className="prefs-stack mt-3">
              <Choice
                selected={showClock}
                icon={<Clock className="h-3.5 w-3.5" />}
                title={t("settings.showClock")}
                hint={t("settings.showClockHint")}
                onClick={() => setShowClock(!showClock)}
              />
            </div>
          ) : null}

          <div className="prefs-foot">
            <div className="prefs-foot-copy">
              <Lightbulb className="h-4 w-4" />
              <p>
                <b>{t("settings.savedAuto")}</b>
                <span>{t("settings.changeAnytime")}</span>
              </p>
            </div>
            <button type="button" className="prefs-reset" onClick={resetPrefs}>
              <RotateCcw className="h-3.5 w-3.5" /> {t("settings.resetDefaults")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
