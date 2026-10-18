import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  checkRateLimit,
  checkRateLimits,
  getClientIp,
  rateLimitMessage,
  resetRateLimits,
} from "@/lib/security/rate-limit";
import { signValue, verifySignedValue } from "@/lib/email/otp-security";

describe("Rate limiter", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks until the window resets", () => {
    const rule = { limit: 3, windowMs: 60_000 };
    const now = 1_000_000;

    expect(checkRateLimit("k", rule, now).allowed).toBe(true);
    expect(checkRateLimit("k", rule, now).allowed).toBe(true);
    expect(checkRateLimit("k", rule, now).allowed).toBe(true);

    const blocked = checkRateLimit("k", rule, now + 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(50_000);

    expect(checkRateLimit("k", rule, now + 60_000).allowed).toBe(true);
  });

  it("keeps keys independent and blocks when any check fails", () => {
    const tight = { limit: 1, windowMs: 60_000 };
    const loose = { limit: 100, windowMs: 60_000 };

    expect(checkRateLimits([["a", tight], ["b", loose]]).allowed).toBe(true);
    expect(checkRateLimits([["a", tight], ["b", loose]]).allowed).toBe(false);
    expect(checkRateLimits([["c", tight], ["b", loose]]).allowed).toBe(true);
  });

  it("reads the first forwarded client IP", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("formats a French retry message", () => {
    expect(rateLimitMessage({ allowed: false, retryAfterMs: 90_000 })).toContain("2 minutes");
  });
});

describe("Signed values (unsubscribe links)", () => {
  beforeEach(() => vi.stubEnv("AUTH_TOKEN_SECRET", "test-auth-token-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("verifies only the exact value and purpose it was signed for", () => {
    const sig = signValue("marketing-unsubscribe", "client@example.com");

    expect(verifySignedValue("marketing-unsubscribe", "client@example.com", sig)).toBe(true);
    expect(verifySignedValue("marketing-unsubscribe", "other@example.com", sig)).toBe(false);
    expect(verifySignedValue("another-purpose", "client@example.com", sig)).toBe(false);
    expect(verifySignedValue("marketing-unsubscribe", "client@example.com", null)).toBe(false);
  });
});
