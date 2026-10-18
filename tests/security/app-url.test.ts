import { describe, it, expect, afterEach, vi } from "vitest";
import { getAppOrigin, PRODUCTION_APP_URL } from "@/lib/utils/app-url";

const attackerHeaders = new Headers({ host: "evil.tld", "x-forwarded-proto": "https" });

describe("getAppOrigin (emailed links)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the configured URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example/");
    expect(getAppOrigin(attackerHeaders)).toBe("https://shop.example");
  });

  it("never trusts the Host header in production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(getAppOrigin(attackerHeaders)).toBe(PRODUCTION_APP_URL);
  });

  it("uses the request host only in development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getAppOrigin(new Headers({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  });
});
