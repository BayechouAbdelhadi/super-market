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

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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
