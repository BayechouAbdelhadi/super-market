import { TIMEZONE_PARIS } from "@/lib/utils/timezone";

/**
 * Background job configuration (pg-boss, stored in the application's Postgres database).
 * Jobs run inside the Next.js server process, started from `instrumentation.ts`.
 */
export const JOBS_CONFIG = {
  /** Postgres schema owned by pg-boss (not exposed through the Supabase API). */
  schema: "pgboss",
  applicationName: "super-market-jobs",
  queues: {
    dueCampaigns: "marketing-due-campaigns",
  },
  dueCampaigns: {
    // Every minute: campaigns have a Paris-time send slot (HH:mm), checked by isCampaignDueNow
    cron: "* * * * *",
    timezone: TIMEZONE_PARIS,
    // Upper bound for one run (a large batch can take a while)
    expireInSeconds: 30 * 60,
    // A run whose server stopped (e.g. a redeploy) is retried once its heartbeat is this stale
    heartbeatSeconds: 30,
    retryLimit: 2,
    retryDelaySeconds: 30,
  },
  /** Delay before retrying to start the jobs when the database is unreachable at boot. */
  startRetryDelayMs: 60_000,
  shutdownTimeoutMs: 20_000,
} as const;
