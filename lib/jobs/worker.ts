import { PgBoss, type ConstructorOptions } from "pg-boss";
import { JOBS_CONFIG } from "./config";
import { triggerDueCampaigns } from "@/lib/marketing/service";

/**
 * Sends the batches of every campaign whose Paris-time slot has arrived.
 * Exported for tests; the scheduled queue runs it.
 */
export async function runDueCampaigns(trigger: typeof triggerDueCampaigns = triggerDueCampaigns) {
  const results = await trigger();
  const sent = results.reduce((sum, r) => sum + r.sentInBatch, 0);
  const failed = results.reduce((sum, r) => sum + r.failedInBatch, 0);
  if (results.length > 0) {
    console.log(`[jobs] ${results.length} campaign(s) processed: ${sent} sent, ${failed} failed`);
  }
  return { campaigns: results.length, sent, failed };
}

/**
 * Starts pg-boss, registers the cron schedule and the queue handlers.
 * Safe with several server instances: the schedule fires once per tick cluster-wide and the
 * `exclusive` queue policy allows a single queued-or-active run at a time.
 */
export async function startWorker(
  connection: ConstructorOptions,
  dueCampaignsHandler: () => Promise<unknown> = runDueCampaigns
): Promise<PgBoss> {
  const { queues, dueCampaigns, schema, applicationName } = JOBS_CONFIG;

  const boss = new PgBoss({ schema, application_name: applicationName, ...connection });
  boss.on("error", (err) => console.error("[jobs] pg-boss error:", err));

  await boss.start();

  await boss.createQueue(queues.dueCampaigns, {
    policy: "exclusive",
    expireInSeconds: dueCampaigns.expireInSeconds,
    heartbeatSeconds: dueCampaigns.heartbeatSeconds,
    retryLimit: dueCampaigns.retryLimit,
    retryDelay: dueCampaigns.retryDelaySeconds,
  });
  await boss.schedule(queues.dueCampaigns, dueCampaigns.cron, null, { tz: dueCampaigns.timezone });

  await boss.work(queues.dueCampaigns, async () => {
    await dueCampaignsHandler();
  });

  console.log(`[jobs] started: "${queues.dueCampaigns}" runs on "${dueCampaigns.cron}" (${dueCampaigns.timezone})`);
  return boss;
}
