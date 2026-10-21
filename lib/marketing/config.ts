/**
 * Marketing campaign configuration.
 */
export const MARKETING_CONFIG = {
  /** How long a batch run holds a campaign. Longer than the slowest batch; frees it if a run crashes. */
  batchLockSeconds: 30 * 60,
  /**
   * Banner images of the campaign emails: JPEG (Outlook does not show WebP), 1200 px wide at most
   * (2× the 600 px email width, sharp on phones), stored under compaigns/<campaignId>/ (historical spelling).
   */
  emailImage: { format: "jpeg", maxDimension: 1200, quality: 85, storageFolder: "compaigns" },
} as const;
