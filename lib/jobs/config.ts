import { TIMEZONE_PARIS } from "@/lib/utils/timezone";

/**
 * Background job configuration (pg-boss, stored in the application's Postgres database).
 */
export const JOBS_CONFIG = {
  /** Postgres schema owned by pg-boss (not exposed through the Supabase API). */
  schema: "pgboss",
  applicationName: "super-market-worker",
  queues: {
    dueCampaigns: "marketing-due-campaigns",
  },
  dueCampaigns: {
    // Every minute: campaigns have a Paris-time send slot (HH:mm), checked by isCampaignDueNow
    cron: "* * * * *",
    timezone: TIMEZONE_PARIS,
    // A run sending a large batch may take a while; after this it is considered stuck and retried
    expireInSeconds: 30 * 60,
    retryLimit: 2,
    retryDelaySeconds: 30,
  },
  shutdownTimeoutMs: 30_000,
} as const;
