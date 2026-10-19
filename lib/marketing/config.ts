/**
 * Marketing campaign configuration.
 */
export const MARKETING_CONFIG = {
  /** How long a batch run holds a campaign. Longer than the slowest batch; frees it if a run crashes. */
  batchLockSeconds: 30 * 60,
} as const;
