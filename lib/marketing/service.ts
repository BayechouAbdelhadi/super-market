import crypto from "crypto";
import {
  MarketingCampaign,
  CreateCampaignInput,
  CampaignRecipient,
  CampaignStats,
  ProcessBatchResult,
} from "./types";
import { IMarketingCampaignRepository, ICampaignAudienceRepository } from "./ports";
import { defaultMarketingRepo } from "./adapters/supabase-marketing-repository";
import { SupabaseCampaignAudienceRepository } from "./adapters/supabase-audience-repository";
import { calculateTier } from "@/lib/loyalty/domain";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { emailService, IEmailService } from "@/lib/email";
import { IUserAccountRepository } from "@/lib/auth/ports";
import { SupabaseUserAccountRepository } from "@/lib/auth/adapters/supabase-user-account-repository";
import { getAppSettings } from "@/lib/settings/service";
import { renderDealEmailHtml } from "./templates/deal-email";
import { getParisDateString, getParisTimeString } from "@/lib/utils/timezone";

import { deduplicateRecipients, UNSUBSCRIBE_SIGNATURE_PURPOSE } from "./utils";
import { signValue } from "@/lib/email/otp-security";
import { PRODUCTION_APP_URL } from "@/lib/utils/app-url";
export { deduplicateRecipients };

const defaultAudienceRepo: ICampaignAudienceRepository = new SupabaseCampaignAudienceRepository();

/**
 * Queries active customers matching the selected loyalty tiers.
 * Returns strictly deduplicated recipients (one entry per unique customer / email).
 */
export async function getTargetCustomersByTiers(
  tiers: LoyaltyTier[],
  repo: IMarketingCampaignRepository = defaultMarketingRepo,
  audienceRepo: ICampaignAudienceRepository = defaultAudienceRepo
): Promise<CampaignRecipient[]> {
  // No fallback on failure: an audience built without the opt-out list would email people who unsubscribed
  const unsubscribed = await repo.getUnsubscribedEmails();
  const unsubscribedSet = new Set(unsubscribed.map((e) => e.trim().toLowerCase()));

  const data = await audienceRepo.listCustomersWithEmail();
  const recipients: CampaignRecipient[] = [];

  for (const row of data) {
    if (!row.email || !row.email.includes("@")) continue;
    const emailKey = row.email.trim().toLowerCase();
    if (unsubscribedSet.has(emailKey)) {
      continue; // Exclude unsubscribed customer from targeting!
    }

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

  return deduplicateRecipients(recipients);
}

/**
 * Checks whether a campaign is currently due to execute according to Europe/Paris time.
 */
export function isCampaignDueNow(
  campaign: MarketingCampaign,
  referenceDate: Date = new Date()
): boolean {
  if (
    campaign.status === "DRAFT" ||
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
 * Creates and registers a new marketing campaign job or draft.
 */
export async function createMarketingCampaign(
  input: CreateCampaignInput,
  adminEmail?: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<MarketingCampaign> {
  const freshRecipients = await getTargetCustomersByTiers(input.targetTiers, repo);

  const campaignId = input.id || crypto.randomUUID();
  const existing = input.id ? await repo.getById(input.id) : null;

  // When editing an existing campaign/draft, merge without duplicating:
  // Retain already SENT or FAILED status so customers are never emailed twice!
  let mergedRecipients: CampaignRecipient[];
  if (existing?.recipients && existing.recipients.length > 0) {
    const existingMap = new Map<string, CampaignRecipient>();
    for (const r of existing.recipients) {
      const key = r.email.trim().toLowerCase();
      if (!existingMap.has(key)) {
        existingMap.set(key, r);
      }
    }

    mergedRecipients = freshRecipients.map((fresh) => {
      const existingR = existingMap.get(fresh.email.trim().toLowerCase());
      return existingR || fresh;
    });
  } else {
    mergedRecipients = freshRecipients;
  }

  const recipients = deduplicateRecipients(mergedRecipients);
  const sentCount = recipients.filter((r) => r.status === "SENT").length;
  const failedCount = recipients.filter((r) => r.status === "FAILED").length;
  const remainingCount = recipients.filter((r) => r.status === "PENDING").length;
  const progressPercentage =
    recipients.length > 0 ? Math.round(((sentCount + failedCount) / recipients.length) * 100) : 0;

  const stats: CampaignStats = {
    totalTargets: recipients.length,
    sentCount,
    failedCount,
    remainingCount,
    progressPercentage,
  };

  const now = new Date().toISOString();
  const todayStr = getParisDateString();
  const currentTimeStr = getParisTimeString();

  // If start date is in the past, or start date is today and scheduled time has arrived/passed
  const isDueToday =
    input.startDate < todayStr ||
    (input.startDate === todayStr && currentTimeStr >= (input.scheduledTime?.trim() || "00:00"));

  const initialStatus =
    input.status === "DRAFT"
      ? "DRAFT"
      : recipients.length === 0
      ? "DRAFT"
      : isDueToday
      ? "RUNNING"
      : "SCHEDULED";

  const campaign: MarketingCampaign = {
    id: campaignId,
    title: input.title.trim() || "Brouillon sans titre",
    status: initialStatus,
    targetTiers: input.targetTiers,
    dispatchMode: input.dispatchMode,
    dailyLimit: input.dispatchMode === "DAILY_LIMIT" ? input.dailyLimit || 100 : null,
    startDate: input.startDate,
    endDate: input.endDate,
    scheduledTime: input.scheduledTime?.trim() || "00:00",
    lastRunDate: existing?.lastRunDate || null,
    subject: input.subject.trim(),
    content: input.content.trim(),
    imageUrl: input.imageUrl ? input.imageUrl.trim() : null,
    ctaText: input.ctaText?.trim() || "Découvrir les offres en magasin",
    ctaUrl: input.ctaUrl?.trim() || PRODUCTION_APP_URL,
    stats,
    recipients,
    createdAt: existing?.createdAt || now,
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
 * Duplication prevention guarantee: Each customer receives at most ONE email.
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

  const rawRecipients = campaign.recipients || [];
  const recipients = deduplicateRecipients(rawRecipients);
  campaign.recipients = recipients;

  // Strict deduplication: customers who already received or failed must NEVER be sent again
  const alreadyHandledEmails = new Set<string>(
    recipients
      .filter((r) => r.status === "SENT" || r.status === "FAILED")
      .map((r) => r.email.trim().toLowerCase())
  );

  const pendingRecipients: CampaignRecipient[] = [];
  const pendingEmailsSeen = new Set<string>();

  for (const r of recipients) {
    if (r.status !== "PENDING") continue;
    const emailKey = r.email.trim().toLowerCase();
    if (alreadyHandledEmails.has(emailKey) || pendingEmailsSeen.has(emailKey)) {
      continue;
    }
    pendingEmailsSeen.add(emailKey);
    pendingRecipients.push(r);
  }

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
  const processedBatchEmails = new Set<string>();

  // No fallback on failure: an audience built without the opt-out list would email people who unsubscribed
  const unsubscribed = await repo.getUnsubscribedEmails();
  const unsubscribedSet = new Set(unsubscribed.map((e) => e.trim().toLowerCase()));

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    PRODUCTION_APP_URL;

  for (const recipient of batch) {
    const emailKey = recipient.email.trim().toLowerCase();
    if (processedBatchEmails.has(emailKey)) {
      continue;
    }
    processedBatchEmails.add(emailKey);

    // If customer unsubscribed since campaign scheduling, cancel recipient and skip sending!
    if (unsubscribedSet.has(emailKey)) {
      recipient.status = "CANCELLED";
      recipient.error = "Client désabonné des e-mails promotionnels";
      continue;
    }

    try {
      const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, recipient.email);

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
        unsubscribeUrl,
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
    } catch (err) {
      // Catch any unexpected network / runtime exceptions
      recipient.status = "FAILED";
      recipient.error = (err instanceof Error && err.message) || "Erreur inconnue lors de l'envoi";
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

/**
 * Unsubscribes an email address from receiving marketing campaigns.
 */
/**
 * Signed one-click unsubscribe link for an email address (see UNSUBSCRIBE_SIGNATURE_PURPOSE).
 */
export function buildUnsubscribeUrl(baseUrl: string, email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  const sig = signValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, cleanEmail);
  return `${baseUrl}/unsubscribe?email=${encodeURIComponent(cleanEmail)}&sig=${sig}`;
}

export interface UnsubscribeRequestDeps {
  accounts: Pick<IUserAccountRepository, "findProfileByEmail">;
  mailer: Pick<IEmailService, "sendUnsubscribeConfirmation">;
  repo: IMarketingCampaignRepository;
}

/**
 * Use case: unsubscribe request typed into the public form (double opt-out).
 * Emails a signed confirmation link, only to addresses of existing customers who
 * are still subscribed. Callers must answer identically whatever happens here
 * (no account enumeration).
 */
export async function requestUnsubscribeConfirmation(
  email: string,
  baseUrl: string,
  deps: UnsubscribeRequestDeps = {
    accounts: new SupabaseUserAccountRepository(),
    mailer: emailService,
    repo: defaultMarketingRepo,
  }
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const profile = await deps.accounts.findProfileByEmail(cleanEmail);
  if (!profile || profile.role !== "CUSTOMER") {
    return;
  }
  if (await deps.repo.isUnsubscribed(cleanEmail)) {
    return;
  }

  const result = await deps.mailer.sendUnsubscribeConfirmation({
    email: cleanEmail,
    unsubscribeLink: buildUnsubscribeUrl(baseUrl, cleanEmail),
  });
  if (!result.success) {
    console.error("[MarketingService] Unsubscribe confirmation email failed:", result.error);
  }
}

export async function unsubscribeCustomerEmail(
  email: string,
  reason?: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<boolean> {
  return await repo.unsubscribe(email, reason);
}

/**
 * Re-subscribes an email address to marketing campaigns.
 */
export async function resubscribeCustomerEmail(
  email: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<boolean> {
  return await repo.resubscribe(email);
}

/**
 * Checks if an email address is unsubscribed.
 */
export async function isCustomerEmailUnsubscribed(
  email: string,
  repo: IMarketingCampaignRepository = defaultMarketingRepo
): Promise<boolean> {
  return await repo.isUnsubscribed(email);
}

