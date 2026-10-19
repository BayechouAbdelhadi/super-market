import { describe, it, expect } from "vitest";
import { themes, themeToCss, activeTheme, loadThemes, themeJsonSchema, type ThemeColors } from "@/lib/theme";
import themeSchema from "@/config/theme.schema.json";
import themeConfig from "@/config/theme.json";

/** A copy of config/theme.json to break in each test. */
function configCopy() {
  return JSON.parse(JSON.stringify(themeConfig));
}

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

  it("merges a preset over the one it extends", () => {
    expect(themes.warm.light.primary).toBe("#c2410c");
    expect(themes.warm.dark.primary).toBe("#c2410c");
    expect(themes.warm.dark.background).toBe(themes.default.dark.background);
    expect(themes.warm.light.success).toBe(themes.default.light.success);
    expect(themes.warm.radius.card).toBe("18px");
    expect(themes.emerald.radius).toEqual(themes.default.radius);
  });

  it("renders the preset named by `active`", () => {
    expect(activeTheme.name).toBe(themeConfig.active);
  });

  describe("rejects a broken config/theme.json", () => {
    it("a misspelled color key", () => {
      const config = configCopy();
      config.presets.warm.light.primaryy = "#000000";
      expect(() => loadThemes(config)).toThrow(/presets\.warm\.light/);
    });

    it("an invalid color value", () => {
      const config = configCopy();
      config.presets.default.light.text = "red";
      expect(() => loadThemes(config)).toThrow(/presets\.default\.light\.text/);
    });

    it("a missing color in a preset that extends nothing", () => {
      const config = configCopy();
      delete config.presets.default.dark.scrim;
      expect(() => loadThemes(config)).toThrow(/presets\.default\.dark\.scrim/);
    });

    it("an unknown preset in `extends` or `active`", () => {
      const config = configCopy();
      config.presets.warm.extends = "nope";
      expect(() => loadThemes(config)).toThrow(/preset "nope" is not defined/);

      const other = configCopy();
      other.active = "nope";
      expect(() => loadThemes(other)).toThrow(/"active" is "nope"/);
    });

    it("an `extends` loop", () => {
      const config = configCopy();
      config.presets.default.extends = "warm";
      expect(() => loadThemes(config)).toThrow(/loop/);
    });
  });

  it("ships an up-to-date JSON Schema for editors (run `npm run theme:schema` if this fails)", () => {
    expect(themeSchema).toEqual(themeJsonSchema());
  });
});
