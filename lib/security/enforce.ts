import { IRateLimitStore } from "./ports";
import { SupabaseRateLimitStore } from "./adapters/supabase-rate-limit-store";
import { checkRateLimit, RateLimitResult, RateLimitRule } from "./rate-limit";

const defaultStore: IRateLimitStore = new SupabaseRateLimitStore();

/**
 * Counts one hit per (key, rule) in the shared store; blocked if any limit is exceeded.
 * If the shared store is unreachable, falls back to the in-process counters so
 * authentication never breaks because of the limiter.
 */
export async function enforceRateLimits(
  checks: Array<[string, RateLimitRule]>,
  store: IRateLimitStore = defaultStore
): Promise<RateLimitResult> {
  let result: RateLimitResult = { allowed: true, retryAfterMs: 0 };

  for (const [key, rule] of checks) {
    let current: RateLimitResult;
    try {
      current = await store.hit(key, rule);
    } catch (err) {
      console.warn("[RateLimit] Shared store unavailable, using in-memory counters:", err instanceof Error ? err.message : err);
      current = checkRateLimit(key, rule);
    }
    if (!current.allowed && current.retryAfterMs >= result.retryAfterMs) {
      result = current;
    }
  }
  return result;
}
