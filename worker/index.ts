import { startWorker } from "@/lib/jobs/worker";
import { JOBS_CONFIG } from "@/lib/jobs/config";

/**
 * Background worker process (run separately from the Next.js server).
 * Requires DATABASE_URL: a direct Postgres connection to the Supabase database.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[worker] Configuration error: DATABASE_URL is not set.");
    process.exit(1);
  }

  const boss = await startWorker({ connectionString });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`[worker] ${signal} received, finishing active jobs...`);
    await boss.stop({ graceful: true, timeout: JOBS_CONFIG.shutdownTimeoutMs });
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[worker] Failed to start:", err);
  process.exit(1);
});
