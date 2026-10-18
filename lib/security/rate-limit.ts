/**
 * In-memory fixed-window rate limiter for auth and public endpoints.
 *
 * Scope: one Node.js process (the standalone Docker container). If the app is
 * ever scaled to several instances, move the buckets to a shared store
 * (Redis / Postgres) behind the same `checkRateLimit` signature.
 */

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const MINUTE = 60 * 1000;

/** Central limits: generous enough never to block a normal user. */
export const RATE_LIMITS = {
  loginPerAccount: { limit: 10, windowMs: 15 * MINUTE },
  loginPerIp: { limit: 50, windowMs: 15 * MINUTE },
  signupPerIp: { limit: 10, windowMs: 15 * MINUTE },
  signupPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  otpVerifyPerEmail: { limit: 10, windowMs: 15 * MINUTE },
  otpResendPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  passwordResetPerIp: { limit: 10, windowMs: 15 * MINUTE },
  passwordResetPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  unsubscribePerIp: { limit: 60, windowMs: 1 * MINUTE },
} satisfies Record<string, RateLimitRule>;

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Counts one hit for `key` and tells whether it is still within `rule`.
 */
export function checkRateLimit(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) {
    pruneExpired(now);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  bucket.count += 1;
  if (bucket.count > rule.limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Checks several (key, rule) pairs; blocked if any of them is exceeded.
 */
export function checkRateLimits(checks: Array<[string, RateLimitRule]>, now: number = Date.now()): RateLimitResult {
  let result: RateLimitResult = { allowed: true, retryAfterMs: 0 };
  for (const [key, rule] of checks) {
    const current = checkRateLimit(key, rule, now);
    if (!current.allowed && current.retryAfterMs >= result.retryAfterMs) {
      result = current;
    }
  }
  return result;
}

interface HeaderReader {
  get(name: string): string | null;
}

/**
 * Client IP as forwarded by the nginx reverse proxy (X-Forwarded-For / X-Real-IP).
 */
export function getClientIp(requestHeaders: HeaderReader): string {
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

/**
 * French user-facing message for a blocked request.
 */
export function rateLimitMessage(result: RateLimitResult): string {
  const minutes = Math.max(1, Math.ceil(result.retryAfterMs / MINUTE));
  return `Trop de tentatives. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

/** Test helper: clears all counters. */
export function resetRateLimits() {
  buckets.clear();
}
