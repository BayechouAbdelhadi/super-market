import { describe, it, expect } from "vitest";
import { themes, themeToCss, activeTheme, type ThemeColors } from "@/lib/theme";

describe("theme", () => {
  it("defines every base color for both modes in every preset", () => {
    const keys = Object.keys(themes.default.light) as (keyof ThemeColors)[];
    for (const theme of Object.values(themes)) {
      for (const mode of [theme.light, theme.dark]) {
        for (const key of keys) {
          expect(mode[key], `${theme.name}.${key}`).toMatch(/^(#[0-9a-f]{6}|rgb\()/i);
        }
      }
    }
  });

  it("writes light values on :root and dark values under prefers-color-scheme", () => {
    const css = themeToCss(themes.default);
    const [light, dark] = css.split("@media (prefers-color-scheme: dark)");
    expect(light).toContain("--color-surface:#ffffff");
    expect(light).toContain("--radius-card:16px");
    expect(light).toContain("--on-dark-success-text:#6ee7b7");
    expect(dark).toContain("--color-surface:#1e1e1e");
  });

  it("keeps a preset's brand color in dark mode but not its light neutrals", () => {
    expect(themes.warm.dark.primary).toBe(themes.warm.light.primary);
    expect(themes.warm.dark.background).toBe(themes.default.dark.background);
  });

  it("renders the default theme", () => {
    expect(activeTheme.name).toBe("default");
  });
});
