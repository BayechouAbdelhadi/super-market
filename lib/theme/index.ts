/**
 * Theme loader (AGENTS.md § 11–13). The theme itself is configured in config/theme.json.
 *
 * The JSON is validated at build time: a typo in a key, a missing color or an invalid value
 * fails the build with a clear message. The active theme is written as CSS variables by the
 * root layout (`themeToCss`); app/globals.css derives tints, borders, shadows and gradients.
 */
import { z } from "zod";
import themeConfig from "@/config/theme.json";

const color = z
  .string()
  .regex(/^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/, 'expected "#rrggbb" or "rgb(…)"');
const length = z.string().regex(/^\d+(\.\d+)?(px|rem)$/, 'expected a length like "12px"');

const c = (description: string) => color.describe(description);

const ThemeColorsSchema = z.strictObject({
  background: c("Page background"),
  surface: c("Cards, panels, inputs"),
  surfaceHover: c("Hovered or secondary surfaces"),
  text: c("Main text"),
  textMuted: c("Secondary text, hints, labels"),
  border: c("Hairline borders and dividers"),
  borderHover: c("Hovered or stronger borders"),
  primary: c("Brand color: main buttons, links, accents"),
  primaryHover: c("Primary on hover"),
  primaryText: c("Text on the primary color"),
  success: c("Success fills and icons"),
  successText: c("Readable success text on surfaces and success tints"),
  warning: c("Warning fills and icons"),
  warningText: c("Readable warning text on surfaces and warning tints"),
  danger: c("Error and destructive fills and icons"),
  dangerText: c("Readable error text on surfaces and danger tints"),
  info: c("Informational fills and icons"),
  infoText: c("Readable info text on surfaces and info tints"),
  highlight: c("Secondary accent for special items (premium features, team, VIP-style labels)"),
  highlightText: c("Readable highlight text on surfaces and highlight tints"),
  onColor: c("Text and icons on any solid colored fill"),
  overlay: c('Backdrop behind dialogs and drawers, usually "rgb(0 0 0 / 0.4)"'),
  scrim: c("Fixed near-black for scrims over photos"),
  tierBronze: c("Bronze tier tone"),
  tierSilver: c("Silver tier tone"),
  tierGold: c("Gold tier tone"),
  tierVip: c("VIP tier tone (solid badge background)"),
  tierBronzeText: c("Readable text on the bronze tint"),
  tierSilverText: c("Readable text on the silver tint"),
  tierGoldText: c("Readable text on the gold tint"),
});

const ThemeRadiusSchema = z.strictObject({
  button: length.describe("Corner radius of buttons"),
  input: length.describe("Corner radius of inputs"),
  card: length.describe("Corner radius of cards"),
  dialog: length.describe("Corner radius of dialogs and large containers"),
});

/** A preset lists only what it changes from the preset it extends; a root preset lists everything. */
const PresetSchema = z.strictObject({
  label: z.string().min(1).describe("Human-readable name of the preset"),
  extends: z.string().optional().describe("Preset to start from; list only the values that change"),
  light: ThemeColorsSchema.partial().optional().describe("Colors in light mode"),
  dark: ThemeColorsSchema.partial().optional().describe("Colors when the device is in dark mode"),
  radius: ThemeRadiusSchema.partial().optional().describe("Corner radii"),
});

const ThemeFileSchema = z.strictObject({
  $schema: z.string().optional(),
  active: z.string().describe("Name of the preset the app renders with"),
  presets: z.record(z.string(), PresetSchema).describe("Theme presets, by name"),
});

/** JSON Schema of config/theme.json, for editor autocomplete (written by `npm run theme:schema`). */
export function themeJsonSchema(): Record<string, unknown> {
  return {
    title: "Super Market theme (config/theme.json)",
    ...z.toJSONSchema(ThemeFileSchema, { target: "draft-07" }),
  };
}

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
export type ThemeRadius = z.infer<typeof ThemeRadiusSchema>;

export interface ThemeConfig {
  name: string;
  label: string;
  light: ThemeColors;
  /** Used when the device is in dark mode */
  dark: ThemeColors;
  radius: ThemeRadius;
}

type ThemeFile = z.infer<typeof ThemeFileSchema>;

function fail(message: string): never {
  throw new Error(`[theme] config/theme.json: ${message}`);
}

/** Resolves every preset (following `extends`) into a complete, validated theme. */
export function loadThemes(input: unknown): { themes: Record<string, ThemeConfig>; active: ThemeConfig } {
  const parsed = ThemeFileSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    fail(`${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  const file: ThemeFile = parsed.data;

  const resolved: Record<string, ThemeConfig> = {};
  const resolve = (name: string, chain: string[] = []): ThemeConfig => {
    if (resolved[name]) return resolved[name];
    const preset = file.presets[name];
    if (!preset) fail(`preset "${name}" is not defined`);
    if (chain.includes(name)) fail(`"extends" loop: ${[...chain, name].join(" → ")}`);

    const parent = preset.extends ? resolve(preset.extends, [...chain, name]) : null;
    const complete = (mode: "light" | "dark") => {
      const result = ThemeColorsSchema.safeParse({ ...parent?.[mode], ...preset[mode] });
      if (!result.success) {
        fail(`presets.${name}.${mode}.${result.error.issues[0].path.join(".")}: missing or invalid`);
      }
      return result.data;
    };
    const radius = ThemeRadiusSchema.safeParse({ ...parent?.radius, ...preset.radius });
    if (!radius.success) fail(`presets.${name}.radius.${radius.error.issues[0].path.join(".")}: missing or invalid`);

    resolved[name] = { name, label: preset.label, light: complete("light"), dark: complete("dark"), radius: radius.data };
    return resolved[name];
  };

  for (const name of Object.keys(file.presets)) resolve(name);
  const active = resolved[file.active] ?? fail(`"active" is "${file.active}", which is not a preset`);
  return { themes: resolved, active };
}

const loaded = loadThemes(themeConfig);

/** Every preset of config/theme.json, resolved. */
export const themes = loaded.themes;
/** The theme the app renders with (`active` in config/theme.json). */
export const activeTheme: ThemeConfig = loaded.active;

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
