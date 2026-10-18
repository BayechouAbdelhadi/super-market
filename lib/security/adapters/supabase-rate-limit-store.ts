import { IRateLimitStore } from "../ports";
import type { RateLimitResult, RateLimitRule } from "../rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Infrastructure Adapter: counters in Postgres via the atomic `rate_limit_hit` function
 * (shared by every app instance, survives restarts).
 */
export class SupabaseRateLimitStore implements IRateLimitStore {
  async hit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: key,
      p_limit: rule.limit,
      p_window_ms: rule.windowMs,
    });

    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) {
      throw new Error(`rate_limit_hit failed: ${error?.message ?? "no result"}`);
    }
    return { allowed: Boolean(row.allowed), retryAfterMs: Number(row.retry_after_ms) || 0 };
  }
}
