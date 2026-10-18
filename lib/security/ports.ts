import type { RateLimitResult, RateLimitRule } from "./rate-limit";

/**
 * Domain Port: shared rate-limit counter store.
 */
export interface IRateLimitStore {
  /** Counts one hit for `key` and tells whether it is still within `rule`. May throw if the store is unreachable. */
  hit(key: string, rule: RateLimitRule): Promise<RateLimitResult>;
}
