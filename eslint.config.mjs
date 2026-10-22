import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Colors come from the theme tokens in app/globals.css (AGENTS.md § 10): no raw Tailwind palette
// classes (bg-emerald-500, text-slate-900…) and no hex colors in components.
const RAW_PALETTE_CLASS =
  "/(^|[\\s:\"'`])(bg|text|border|ring|from|via|to|fill|stroke|outline|divide|shadow|placeholder|decoration|caret)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]|\\b)/";
const HEX_COLOR = "/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b/";
const RAW_COLOR_MESSAGE =
  "Use a theme token (bg-surface, text-text-muted, text-success-text, bg-danger-subtle…) instead of a raw color. See app/globals.css.";

// Viewport containment (AGENTS.md § 25.1 and § 25.3): shells inherit the height from html/body (100svh in
// app/globals.css), so these units are forbidden; they overflow or jump on iOS Safari.
const VIEWPORT_UNIT_CLASS = "/(^|[\\s:\"'`])(min-h-screen|h-screen|h-dvh|min-h-dvh|w-screen)(?=[\\s\"'`]|$)|100dvh/";
const VIEWPORT_UNIT_MESSAGE =
  "Viewport units break the fixed shell on iOS (AGENTS.md § 25.1): use h-full / w-full and let app/globals.css own the height.";
// `inset-y-0` stays applied under `md:relative` and corrupts the sidebar height on iPadOS (AGENTS.md § 25.3)
const INSET_WITH_RELATIVE = "/inset-y-0.*md:relative|md:relative.*inset-y-0/";
const INSET_WITH_RELATIVE_MESSAGE =
  "Use `fixed top-0 bottom-0 left-0` with `md:static` for the sidebar (AGENTS.md § 25.3), never `inset-y-0` with `md:relative`.";
const LAYOUT_RULES = [
  { selector: `Literal[value=${VIEWPORT_UNIT_CLASS}]`, message: VIEWPORT_UNIT_MESSAGE },
  { selector: `TemplateElement[value.raw=${VIEWPORT_UNIT_CLASS}]`, message: VIEWPORT_UNIT_MESSAGE },
  { selector: `Literal[value=${INSET_WITH_RELATIVE}]`, message: INSET_WITH_RELATIVE_MESSAGE },
  { selector: `TemplateElement[value.raw=${INSET_WITH_RELATIVE}]`, message: INSET_WITH_RELATIVE_MESSAGE },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Layout rules apply everywhere, including the fixed-color files below. The next block repeats them, because a
  // later `no-restricted-syntax` replaces this one instead of adding to it.
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    rules: { "no-restricted-syntax": ["error", ...LAYOUT_RULES] },
  },
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    // Fixed colors on purpose: they must look the same whatever the theme or mode
    ignores: [
      "components/loyalty/DigitalLoyaltyCard.tsx", // loyalty card artwork
      "components/admin/invite/FidelityPoster.tsx", // printable poster
      "components/admin/invite/PrintInviteQrModal.tsx", // print stylesheet
      "components/admin/deals/EmailVisualizerModal.tsx", // phone mockup around the email preview
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${RAW_PALETTE_CLASS}]`, message: RAW_COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=${RAW_PALETTE_CLASS}]`, message: RAW_COLOR_MESSAGE },
        { selector: `Literal[value=${HEX_COLOR}]`, message: RAW_COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=${HEX_COLOR}]`, message: RAW_COLOR_MESSAGE },
        ...LAYOUT_RULES,
      ],
    },
  },
  {
    rules: {
      // "_name" marks a value ignored on purpose (e.g. a field left out of `...rest`)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
