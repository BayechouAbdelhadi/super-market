/**
 * Runs once when a Next.js server instance starts.
 * Starts the background jobs (scheduled campaign sending) in the Node.js runtime only.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundJobs } = await import("./lib/jobs/start");
    startBackgroundJobs();
  }
}
