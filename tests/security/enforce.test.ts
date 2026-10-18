import { describe, it, expect, beforeEach, vi } from "vitest";
import { enforceRateLimits } from "@/lib/security/enforce";
import { IRateLimitStore } from "@/lib/security/ports";
import { resetRateLimits } from "@/lib/security/rate-limit";

class FakeStore implements IRateLimitStore {
  counts = new Map<string, number>();
  async hit(key: string, rule: { limit: number }) {
    const count = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, count);
    return { allowed: count <= rule.limit, retryAfterMs: count <= rule.limit ? 0 : 30_000 };
  }
}

class DownStore implements IRateLimitStore {
  async hit(): Promise<never> {
    throw new Error("database unreachable");
  }
}

describe("enforceRateLimits", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("uses the shared store and blocks once any limit is exceeded", async () => {
    const store = new FakeStore();
    const rules: Array<[string, { limit: number; windowMs: number }]> = [
      ["login:account:a@b.c", { limit: 2, windowMs: 60_000 }],
      ["login:ip:1.2.3.4", { limit: 50, windowMs: 60_000 }],
    ];

    expect((await enforceRateLimits(rules, store)).allowed).toBe(true);
    expect((await enforceRateLimits(rules, store)).allowed).toBe(true);
    const blocked = await enforceRateLimits(rules, store);
    expect(blocked).toEqual({ allowed: false, retryAfterMs: 30_000 });
  });

  it("falls back to in-memory counters when the store is down (never blocks auth by itself)", async () => {
    const store = new DownStore();
    const rule = { limit: 1, windowMs: 60_000 };

    expect((await enforceRateLimits([["k", rule]], store)).allowed).toBe(true);
    expect((await enforceRateLimits([["k", rule]], store)).allowed).toBe(false);
  });
});
