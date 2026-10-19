import { describe, it, expect } from "vitest";
import { runDueCampaigns } from "@/lib/jobs/worker";
import { JOBS_CONFIG } from "@/lib/jobs/config";
import type { ProcessBatchResult } from "@/lib/marketing/types";

function batch(sentInBatch: number, failedInBatch: number): ProcessBatchResult {
  return {
    campaignId: crypto.randomUUID(),
    processedCount: sentInBatch + failedInBatch,
    sentInBatch,
    failedInBatch,
    newStatus: "RUNNING",
    stats: { totalTargets: 0, sentCount: 0, failedCount: 0, remainingCount: 0, progressPercentage: 0 },
  };
}

describe("due campaigns job", () => {
  it("sends due campaigns and sums the batch results", async () => {
    const summary = await runDueCampaigns(async () => [batch(10, 1), batch(5, 0)]);
    expect(summary).toEqual({ campaigns: 2, sent: 15, failed: 1 });
  });

  it("propagates failures so pg-boss retries the run", async () => {
    await expect(runDueCampaigns(async () => { throw new Error("db down"); })).rejects.toThrow("db down");
  });

  it("checks every minute in Paris time, matching the HH:mm campaign slots", () => {
    expect(JOBS_CONFIG.dueCampaigns.cron).toBe("* * * * *");
    expect(JOBS_CONFIG.dueCampaigns.timezone).toBe("Europe/Paris");
  });
});
