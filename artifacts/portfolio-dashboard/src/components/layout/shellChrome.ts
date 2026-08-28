/** Shared shell chrome utilities (Shell + DisplaySettingsMenu). */
import { UI_ICON_BTN } from "@/lib/uiPattern";

/** Circular header/action button — matches Notification reference via `.ui-icon-btn` */
export const SHELL_CIRCLE = [
  UI_ICON_BTN,
  "text-(--shell-muted) hover:text-(--shell-blue) focus:outline-none focus-visible:outline-none",
  "data-[state=open]:text-(--shell-blue)",
].join(" ");

export const SHELL_CIRCLE_OPEN =
  "text-(--shell-blue) shadow-[var(--ui-control-shadow-focus)]";

export const SHELL_ACTION_ICON =
  "pointer-events-none size-5 object-contain drop-shadow-[0_4px_8px_color-mix(in_srgb,var(--shell-blue)_28%,transparent)]";

/** @deprecated Prefer BRAND_PALETTE / BRAND_ACCENT from brandTheme */
export { BRAND_PALETTE as SHELL_PALETTE_BLUE, BRAND_ACCENT as SHELL_ACCENT } from "@/lib/brandTheme";
