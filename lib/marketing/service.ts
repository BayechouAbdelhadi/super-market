import crypto from "crypto";
import {
  MarketingCampaign,
  CreateCampaignInput,
  CampaignRecipient,
  CampaignStats,
  ProcessBatchResult,
} from "./types";
import { IMarketingCampaignRepository } from "./ports";
import { defaultMarketingRepo } from "./adapters/supabase-marketing-repository";
import { createClient } from "@/lib/supabase/server";
import { calculateTier } from "@/lib/loyalty/domain";
import { LoyaltyTier, ProfileWithCustomerRow } from "@/lib/loyalty/types";
import { emailService } from "@/lib/email";
import { getAppSettings } from "@/lib/settings/service";
import { renderDealEmailHtml } from "./templates/deal-email";
import { getParisDateString, getParisTimeString } from "@/lib/utils/timezone";

/**
 * Queries active customers matching the selected loyalty tiers.
 */
export async function getTargetCustomersByTiers(
  tiers: LoyaltyTier[]
): Promise<CampaignRecipient[]> {
  const sb = await createClient();
  const { data, error } = await sb
    .from("profiles")
    .select(`
      id, first_name, last_name, email, phone_number,
      customers ( loyalty_points, status )
    `)
    .eq("role", "CUSTOMER")
    .not("email", "is", null);

  if (error || !data) {
    console.error("[MarketingService] Error fetching targeted customers:", error);
    return [];
  }

  const recipients: CampaignRecipient[] = [];

  for (const row of data as ProfileWithCustomerRow[]) {
    if (!row.email || !row.email.includes("@")) continue;

    const cust = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    const points = cust?.loyalty_points ?? 0;
    const tier = (cust?.status as LoyaltyTier) || calculateTier(points) || "BRONZE";

    if (tiers.includes(tier)) {
      const firstName = row.first_name || "";
      const lastName = row.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || row.email;

      recipients.push({
        customerId: row.id,
        email: row.email.trim(),
        fullName,
        tier,
        status: "PENDING",
      });
    }
  }

  return recipients;
}

/**
 * Checks whether a campaign is currently due to execute according to Europe/Paris time.
 */
export function isCampaignDueNow(
  campaign: MarketingCampaign,
  referenceDate: Date = new Date()
): boolean {
  if (
    campaign.status === "PAUSED" ||
    campaign.status === "COMPLETED" ||
    campaign.status === "CANCELLED"
  ) {
    return false;
  }

  const todayStr = getParisDateString(referenceDate);
  const currentTimeStr = getParisTimeString(referenceDate);

  // Has not reached start date yet
  if (campaign.startDate > todayStr) {
    return false;
  }

  // Already ended
  if (campaign.endDate < todayStr) {
    return false;
  }

  // For DAILY_LIMIT, if it has already run today in Paris, do not run again today
  if (campaign.lastRunDate === todayStr && campaign.dispatchMode === "DAILY_LIMIT") {
    return false;
  }

  // If there are no pending recipients left
  if (campaign.stats && campaign.stats.remainingCount === 0) {
    return false;
  }

  // Scheduled time check (e.g. "04:42" or "00:00")
  const scheduledTime = campaign.scheduledTime?.trim() || "00:00";
  if (currentTimeStr < scheduledTime) {
    return false;
  }

  return true;
}

/**
 * Automatically triggers batches for all due campaigns according to Europe/Paris time.
 */
export async function triggerDueCampaigns(
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<ProcessBatchResult[]> {
  const campaigns = await repo.getAll();
  const results: ProcessBatchResult[] = [];

  for (const campaign of campaigns) {
    if (isCampaignDueNow(campaign)) {
      try {
        const res = await processCampaignBatch(campaign.id, repo);
        if (res) results.push(res);
      } catch (err) {
        console.error(`[MarketingService] Error processing due campaign ${campaign.id}:`, err);
      }
    }
  }

  return results;
}

/**
 * Creates and registers a new marketing campaign job.
 */
export async function createMarketingCampaign(
  input: CreateCampaignInput,
  adminEmail?: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<MarketingCampaign> {
  const recipients = await getTargetCustomersByTiers(input.targetTiers);

  const stats: CampaignStats = {
    totalTargets: recipients.length,
    sentCount: 0,
    failedCount: 0,
    remainingCount: recipients.length,
    progressPercentage: 0,
  };

  const now = new Date().toISOString();
  const todayStr = getParisDateString();

  const initialStatus =
    recipients.length === 0
      ? "DRAFT"
      : input.startDate <= todayStr
      ? "RUNNING"
      : "SCHEDULED";

  const campaign: MarketingCampaign = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    status: initialStatus,
    targetTiers: input.targetTiers,
    dispatchMode: input.dispatchMode,
    dailyLimit: input.dispatchMode === "DAILY_LIMIT" ? input.dailyLimit || 100 : null,
    startDate: input.startDate,
    endDate: input.endDate,
    scheduledTime: input.scheduledTime?.trim() || "00:00",
    lastRunDate: null,
    subject: input.subject.trim(),
    content: input.content.trim(),
    imageUrl: input.imageUrl ? input.imageUrl.trim() : null,
    ctaText: input.ctaText?.trim() || "Découvrir les offres en magasin",
    ctaUrl: input.ctaUrl?.trim() || "https://supermarket-calais.fr",
    stats,
    recipients,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    createdBy: adminEmail || "admin",
  };

  await repo.save(campaign);

  // If the campaign's scheduled date and time has already arrived or passed today in Paris,
  // execute the first batch immediately!
  if (isCampaignDueNow(campaign)) {
    try {
      await processCampaignBatch(campaign.id, repo);
      const updated = await repo.getById(campaign.id);
      if (updated) return updated;
    } catch (err) {
      console.error("[MarketingService] Auto-trigger immediately failed:", err);
    }
  }

  return campaign;
}

/**
 * Processes a batch of emails for the given campaign.
 * Non-failing guarantee: If sending fails for an individual customer,
 * it records the error and continues processing remaining recipients.
 */
export async function processCampaignBatch(
  campaignId: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<ProcessBatchResult | null> {
  const campaign = await repo.getById(campaignId);
  if (!campaign) return null;

  // Do not process paused, completed, or cancelled jobs
  if (
    campaign.status === "PAUSED" ||
    campaign.status === "COMPLETED" ||
    campaign.status === "CANCELLED"
  ) {
    return {
      campaignId,
      processedCount: 0,
      sentInBatch: 0,
      failedInBatch: 0,
      newStatus: campaign.status,
      stats: campaign.stats,
    };
  }

  const recipients = campaign.recipients || [];
  const pendingRecipients = recipients.filter((r) => r.status === "PENDING");

  if (pendingRecipients.length === 0) {
    // Already all completed
    campaign.status = "COMPLETED";
    campaign.completedAt = campaign.completedAt || new Date().toISOString();
    campaign.updatedAt = new Date().toISOString();
    await repo.save(campaign);

    return {
      campaignId,
      processedCount: 0,
      sentInBatch: 0,
      failedInBatch: 0,
      newStatus: "COMPLETED",
      stats: campaign.stats,
    };
  }

  // Calculate batch size
  let batchSize = pendingRecipients.length;
  if (campaign.dispatchMode === "DAILY_LIMIT" && campaign.dailyLimit && campaign.dailyLimit > 0) {
    batchSize = Math.min(pendingRecipients.length, campaign.dailyLimit);
  }

  const batch = pendingRecipients.slice(0, batchSize);

  // Fetch store settings for email branding
  let storeName = "Super Market Calais";
  let storeAddress = "205 Avenue Antoine de Saint-Exupéry, 62100 Calais";
  let storePhone = "06 71 54 05 28";
  try {
    const settings = await getAppSettings();
    if (settings.store) {
      storeName = settings.store.storeName || storeName;
      storeAddress = settings.store.address || storeAddress;
      storePhone = settings.store.phone || storePhone;
    }
  } catch {
    // Keep fallback
  }

  let sentInBatch = 0;
  let failedInBatch = 0;

  for (const recipient of batch) {
    try {
      const htmlContent = renderDealEmailHtml({
        customerName: recipient.fullName,
        tier: recipient.tier,
        subject: campaign.subject,
        content: campaign.content,
        imageUrl: campaign.imageUrl,
        ctaText: campaign.ctaText,
        ctaUrl: campaign.ctaUrl,
        storeName,
        storeAddress,
        storePhone,
      });

      const res = await emailService.sendEmail({
        to: [{ email: recipient.email, name: recipient.fullName }],
        subject: campaign.subject,
        htmlContent,
      });

      if (res.success) {
        recipient.status = "SENT";
        recipient.sentAt = new Date().toISOString();
        sentInBatch++;
      } else {
        // Log failure without halting the job
        recipient.status = "FAILED";
        recipient.error = res.error || "Échec d'envoi Brevo";
        failedInBatch++;
      }
    } catch (err: any) {
      // Catch any unexpected network / runtime exceptions
      recipient.status = "FAILED";
      recipient.error = err?.message || "Erreur inconnue lors de l'envoi";
      failedInBatch++;
    }
  }

  // Update recipient list
  const recipientMap = new Map(batch.map((r) => [r.customerId, r]));
  const updatedRecipients = recipients.map((r) => recipientMap.get(r.customerId) || r);

  // Re-calculate stats
  const sentCount = updatedRecipients.filter((r) => r.status === "SENT").length;
  const failedCount = updatedRecipients.filter((r) => r.status === "FAILED").length;
  const remainingCount = updatedRecipients.filter((r) => r.status === "PENDING").length;
  const total = updatedRecipients.length;
  const progressPercentage = total > 0 ? Math.round(((sentCount + failedCount) / total) * 100) : 100;

  campaign.stats = {
    totalTargets: total,
    sentCount,
    failedCount,
    remainingCount,
    progressPercentage,
  };

  const todayStr = getParisDateString();
  campaign.lastRunDate = todayStr;
  campaign.updatedAt = new Date().toISOString();
  campaign.recipients = updatedRecipients;

  if (remainingCount === 0) {
    campaign.status = "COMPLETED";
    campaign.completedAt = new Date().toISOString();
  } else {
    campaign.status = "RUNNING";
  }

  await repo.save(campaign);

  return {
    campaignId,
    processedCount: batch.length,
    sentInBatch,
    failedInBatch,
    newStatus: campaign.status,
    stats: campaign.stats,
  };
}

/**
 * Pauses a running or scheduled campaign job.
 */
export async function pauseCampaign(
  campaignId: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<MarketingCampaign | null> {
  const campaign = await repo.getById(campaignId);
  if (!campaign) return null;
  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") return campaign;

  campaign.status = "PAUSED";
  campaign.updatedAt = new Date().toISOString();
  await repo.save(campaign);
  return campaign;
}

/**
 * Resumes a paused campaign job.
 */
export async function resumeCampaign(
  campaignId: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<MarketingCampaign | null> {
  const campaign = await repo.getById(campaignId);
  if (!campaign) return null;
  if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") return campaign;

  campaign.status = campaign.stats.remainingCount === 0 ? "COMPLETED" : "RUNNING";
  campaign.updatedAt = new Date().toISOString();
  await repo.save(campaign);
  return campaign;
}

/**
 * Deletes a campaign job.
 */
export async function deleteCampaign(
  campaignId: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<boolean> {
  return await repo.delete(campaignId);
}
