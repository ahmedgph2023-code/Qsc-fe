/**
 * Unified chrome patterns — Notification icon button + Date/field pill.
 * Tokens live in `index.css` (`--ui-control-*`, `--ui-icon-btn-*`).
 * Prefer these class names over one-off shadows/radii.
 */

/** Circular action (header notification / settings / language) */
export const UI_ICON_BTN = "ui-icon-btn";

/** Capsule field (inputs, selects, date, search, filters) */
export const UI_FIELD = "control ui-field";

/** Alias — same visual as UI_FIELD (legacy class used across pages) */
export const UI_CONTROL = "control";
