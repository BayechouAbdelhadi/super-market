import type { PgBoss } from "pg-boss";
import { JOBS_CONFIG } from "./config";
import { startWorker } from "./worker";

let started = false;

/**
 * Whether this server process should run the background jobs.
 * Production: whenever DATABASE_URL is set. Development: only with JOBS_IN_DEV=true, so a local
 * `next dev` pointed at production data never sends real campaigns by accident.
 */
export function shouldRunJobs(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!env.DATABASE_URL) return false;
  return env.NODE_ENV === "production" || env.JOBS_IN_DEV === "true";
}

/**
 * Starts the background jobs in this Next.js server process (called from `instrumentation.ts`).
 * Never blocks or fails server startup: if the database is unreachable, it retries later.
 */
export function startBackgroundJobs(): void {
  if (started) return;
  started = true;

  if (!shouldRunJobs()) {
    console.warn("[jobs] not started: set DATABASE_URL (and JOBS_IN_DEV=true in development) to send scheduled campaigns.");
    return;
  }

  const connectionString = (process.env.DATABASE_URL as string).trim();
  if (!isPostgresUrl(connectionString)) {
    console.error(
      '[jobs] not started: DATABASE_URL must start with "postgres://". ' +
        'Check the value has no "DATABASE_URL=" prefix, quotes or spaces.'
    );
    return;
  }

  void bootWithRetry(connectionString);
}

/** A Postgres connection URL (anything else makes the driver connect to a host named "base"). */
export function isPostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\/[^\s"']+$/.test(value);
}

async function bootWithRetry(connectionString: string): Promise<void> {
  try {
    const boss = await startWorker({ connectionString });
    stopOnShutdown(boss);
  } catch (err) {
    console.error(`[jobs] failed to start, retrying in ${JOBS_CONFIG.startRetryDelayMs / 1000}s:`, err);
    setTimeout(() => void bootWithRetry(connectionString), JOBS_CONFIG.startRetryDelayMs).unref();
  }
}

/** Best effort: lets an active run finish. An interrupted run is retried via its heartbeat. */
function stopOnShutdown(boss: PgBoss): void {
  const stop = () => {
    boss.stop({ graceful: true, timeout: JOBS_CONFIG.shutdownTimeoutMs }).catch((err) => {
      console.error("[jobs] error while stopping:", err);
    });
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
