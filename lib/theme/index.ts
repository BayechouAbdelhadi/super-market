/**
 * Single source of the visual theme (AGENTS.md § 11–13).
 *
 * The active theme's base colors and radii are written as CSS variables by the root layout
 * (`themeToCss`). Everything derived from them (tinted backgrounds, borders, shadows, gradients)
 * lives in app/globals.css and follows automatically.
 *
 * To restyle the app, edit a preset or switch ACTIVE_THEME. Never put colors in components.
 */

/** Base colors of one mode (light or dark). */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  border: string;
  borderHover: string;
  primary: string;
  primaryHover: string;
  /** Text on the primary color */
  primaryText: string;
  /** Status colors: base for fills and icons, -Text for readable text on surfaces and tints */
  success: string;
  successText: string;
  warning: string;
  warningText: string;
  danger: string;
  dangerText: string;
  info: string;
  infoText: string;
  /** Secondary accent for special items (premium features, team, VIP-style labels) */
  highlight: string;
  highlightText: string;
  /** Text and icons on any solid colored fill */
  onColor: string;
  /** Backdrop behind dialogs and drawers */
  overlay: string;
  /** Fixed near-black for scrims over photos */
  scrim: string;
  /** Loyalty tiers (AGENTS.md § 15): base tone, and readable text on the tier tint */
  tierBronze: string;
  tierSilver: string;
  tierGold: string;
  tierVip: string;
  tierBronzeText: string;
  tierSilverText: string;
  tierGoldText: string;
}

export interface ThemeRadius {
  button: string;
  input: string;
  card: string;
  dialog: string;
}

export interface ThemeConfig {
  name: string;
  label: string;
  light: ThemeColors;
  /** Used when the device is in dark mode */
  dark: ThemeColors;
  radius: ThemeRadius;
}

const defaultLight: ThemeColors = {
  background: "#ffffff",
  surface: "#ffffff",
  surfaceHover: "#f7f7f7",
  text: "#222222",
  textMuted: "#717171",
  border: "#ebebeb",
  borderHover: "#b0b0b0",
  primary: "#ff385c",
  primaryHover: "#e00b41",
  primaryText: "#ffffff",
  success: "#059669",
  successText: "#047857",
  warning: "#d97706",
  warningText: "#b45309",
  danger: "#e11d48",
  dangerText: "#be123c",
  info: "#4f46e5",
  infoText: "#4338ca",
  highlight: "#9333ea",
  highlightText: "#7e22ce",
  onColor: "#ffffff",
  overlay: "rgb(0 0 0 / 0.4)",
  scrim: "#171717",
  tierBronze: "#a86326",
  tierSilver: "#717171",
  tierGold: "#c28b1e",
  tierVip: "#222222",
  tierBronzeText: "#92400e",
  tierSilverText: "#334155",
  tierGoldText: "#78350f",
};

const defaultDark: ThemeColors = {
  ...defaultLight,
  background: "#141414",
  surface: "#1e1e1e",
  surfaceHover: "#2b2b2b",
  text: "#f7f7f7",
  textMuted: "#b0b0b0",
  border: "#2c2c2c",
  borderHover: "#484848",
  successText: "#6ee7b7",
  warningText: "#fcd34d",
  dangerText: "#fda4af",
  infoText: "#a5b4fc",
  highlightText: "#d8b4fe",
  overlay: "rgb(0 0 0 / 0.65)",
  tierVip: "#f7f7f7",
  tierBronzeText: "#fcd34d",
  tierSilverText: "#cbd5e1",
  tierGoldText: "#fde68a",
};

const defaultRadius: ThemeRadius = {
  button: "12px",
  input: "12px",
  card: "16px",
  dialog: "20px",
};

/** A preset = the default theme with a few overrides. */
function preset(
  name: string,
  label: string,
  overrides: { light?: Partial<ThemeColors>; dark?: Partial<ThemeColors>; radius?: Partial<ThemeRadius> } = {}
): ThemeConfig {
  return {
    name,
    label,
    light: { ...defaultLight, ...overrides.light },
    dark: { ...defaultDark, ...overrides.light, ...overrides.dark },
    radius: { ...defaultRadius, ...overrides.radius },
  };
}

// Neutral overrides of the light presets must not leak into dark mode
const darkNeutrals = (({ background, surface, surfaceHover, text, textMuted, border, borderHover }) => ({
  background,
  surface,
  surfaceHover,
  text,
  textMuted,
  border,
  borderHover,
}))(defaultDark);

export const themes = {
  /** Airbnb-inspired: coral primary, white surfaces, charcoal text */
  default: preset("default", "Airbnb-inspired"),

  /** Terracotta and cream, slightly rounder */
  warm: preset("warm", "Warm Terracotta", {
    light: {
      primary: "#c2410c",
      primaryHover: "#9a3412",
      background: "#fdfbf7",
      surfaceHover: "#fcf8f2",
      text: "#292524",
      textMuted: "#78716c",
      border: "#ede8e1",
      borderHover: "#dcd4c7",
    },
    dark: darkNeutrals,
    radius: { button: "14px", input: "14px", card: "18px", dialog: "24px" },
  }),

  /** Fresh supermarket green */
  emerald: preset("emerald", "Fresh Emerald", {
    light: {
      primary: "#059669",
      primaryHover: "#047857",
      background: "#fafaf9",
      surfaceHover: "#f5f5f4",
      text: "#1c1917",
      textMuted: "#78716c",
      border: "#e7e5e4",
      borderHover: "#d6d3d1",
    },
    dark: darkNeutrals,
  }),
} satisfies Record<string, ThemeConfig>;

export type ThemeName = keyof typeof themes;

/** The theme the app renders with. */
export const ACTIVE_THEME: ThemeName = "default";
export const activeTheme: ThemeConfig = themes[ACTIVE_THEME];

const COLOR_VARS: Record<keyof ThemeColors, string> = {
  background: "--color-background",
  surface: "--color-surface",
  surfaceHover: "--color-surface-hover",
  text: "--color-text",
  textMuted: "--color-text-muted",
  border: "--color-border",
  borderHover: "--color-border-hover",
  primary: "--color-primary",
  primaryHover: "--color-primary-hover",
  primaryText: "--color-primary-text",
  success: "--color-success",
  successText: "--color-success-text",
  warning: "--color-warning",
  warningText: "--color-warning-text",
  danger: "--color-danger",
  dangerText: "--color-danger-text",
  info: "--color-info",
  infoText: "--color-info-text",
  highlight: "--color-highlight",
  highlightText: "--color-highlight-text",
  onColor: "--color-on-color",
  overlay: "--color-overlay",
  scrim: "--color-scrim",
  tierBronze: "--color-tier-bronze",
  tierSilver: "--color-tier-silver",
  tierGold: "--color-tier-gold",
  tierVip: "--color-tier-vip",
  tierBronzeText: "--color-tier-bronze-text",
  tierSilverText: "--color-tier-silver-text",
  tierGoldText: "--color-tier-gold-text",
};

function colorDeclarations(colors: ThemeColors): string[] {
  return (Object.keys(COLOR_VARS) as (keyof ThemeColors)[]).map((key) => `${COLOR_VARS[key]}:${colors[key]}`);
}

/**
 * CSS variables of a theme: light values on :root, dark values under prefers-color-scheme,
 * plus the fixed light/dark values used by the .scheme-light and .scheme-dark classes.
 */
export function themeToCss(theme: ThemeConfig): string {
  const root = [
    ...colorDeclarations(theme.light),
    `--radius-button:${theme.radius.button}`,
    `--radius-input:${theme.radius.input}`,
    `--radius-card:${theme.radius.card}`,
    `--radius-dialog:${theme.radius.dialog}`,
    `--on-dark-success-text:${theme.dark.successText}`,
    `--on-dark-warning-text:${theme.dark.warningText}`,
    `--on-dark-danger-text:${theme.dark.dangerText}`,
    `--on-dark-info-text:${theme.dark.infoText}`,
    `--on-dark-highlight-text:${theme.dark.highlightText}`,
    `--on-light-tier-vip:${theme.light.tierVip}`,
    `--on-light-tier-bronze-text:${theme.light.tierBronzeText}`,
    `--on-light-tier-silver-text:${theme.light.tierSilverText}`,
    `--on-light-tier-gold-text:${theme.light.tierGoldText}`,
    `--on-light-background:${theme.light.background}`,
  ];
  return (
    `:root{${root.join(";")}}` +
    `@media (prefers-color-scheme: dark){:root{${colorDeclarations(theme.dark).join(";")}}}`
  );
}
