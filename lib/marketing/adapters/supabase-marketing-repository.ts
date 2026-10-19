import { createAdminClient } from "@/lib/supabase/admin";
import { IMarketingCampaignRepository } from "../ports";
import {
  MarketingCampaign,
  CampaignRecipient,
  CampaignStats,
  CampaignStatus,
  DispatchMode,
  RecipientStatus,
} from "../types";
import { LoyaltyTier } from "@/lib/loyalty/types";
import { deduplicateRecipients } from "../utils";

/** PostgREST returns at most 1000 rows per request: read and write large sets in chunks of this size. */
const PAGE_SIZE = 1000;

/** Postgres unique violation (e.g. an email that already unsubscribed). */
const UNIQUE_VIOLATION = "23505";

/** Throws a descriptive error for a failed Supabase call, so callers never mistake a failure for success. */
function check(error: { message: string; code?: string } | null, operation: string): void {
  if (error) {
    throw new Error(`[SupabaseMarketingRepo] ${operation} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  }
}

function chunks<T>(items: T[], size = PAGE_SIZE): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function selectAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }>,
  operation: string
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    check(error, operation);
    const page = data ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      return all;
    }
  }
}

interface SupabaseCampaignRow {
  id: string;
  title: string;
  status: string;
  target_tiers: string[];
  dispatch_mode: string;
  daily_limit: number | null;
  start_date: string;
  end_date: string;
  scheduled_time?: string;
  last_run_date: string | null;
  subject: string;
  content: string;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  stats: CampaignStats;
  recipients?: CampaignRecipient[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface SupabaseRecipientRow {
  id?: string;
  campaign_id: string;
  customer_id: string;
  email: string;
  full_name: string;
  tier: string;
  status: string;
  sent_at: string | null;
  error: string | null;
}

function mapToDomain(row: SupabaseCampaignRow): MarketingCampaign {
  return {
    id: row.id,
    title: row.title,
    status: row.status as CampaignStatus,
    targetTiers: (row.target_tiers || []) as LoyaltyTier[],
    dispatchMode: row.dispatch_mode as DispatchMode,
    dailyLimit: row.daily_limit,
    startDate: row.start_date,
    endDate: row.end_date,
    scheduledTime: row.scheduled_time || "00:00",
    lastRunDate: row.last_run_date,
    subject: row.subject,
    content: row.content,
    imageUrl: row.image_url,
    ctaText: row.cta_text || undefined,
    ctaUrl: row.cta_url || undefined,
    stats: row.stats || {
      totalTargets: 0,
      sentCount: 0,
      failedCount: 0,
      remainingCount: 0,
      progressPercentage: 0,
    },
    recipients: (row.recipients || []) as CampaignRecipient[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    createdBy: row.created_by || undefined,
  };
}

function mapToDbRow(campaign: MarketingCampaign): SupabaseCampaignRow {
  return {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    target_tiers: campaign.targetTiers,
    dispatch_mode: campaign.dispatchMode,
    daily_limit: campaign.dailyLimit,
    start_date: campaign.startDate,
    end_date: campaign.endDate,
    scheduled_time: campaign.scheduledTime || "00:00",
    last_run_date: campaign.lastRunDate,
    subject: campaign.subject,
    content: campaign.content,
    image_url: campaign.imageUrl,
    cta_text: campaign.ctaText || null,
    cta_url: campaign.ctaUrl || null,
    stats: campaign.stats,
    recipients: campaign.recipients || [],
    created_by: campaign.createdBy || null,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
    completed_at: campaign.completedAt,
  };
}

function mapRecipientToDomain(row: SupabaseRecipientRow): CampaignRecipient {
  return {
    customerId: row.customer_id,
    email: row.email,
    fullName: row.full_name,
    tier: row.tier as LoyaltyTier,
    status: row.status as RecipientStatus,
    sentAt: row.sent_at || undefined,
    error: row.error || undefined,
  };
}

/**
 * Infrastructure Adapter implementing IMarketingCampaignRepository with Supabase (service role).
 * Supabase is the only store: every failed call throws, nothing is silently written elsewhere.
 */
export class SupabaseMarketingRepository implements IMarketingCampaignRepository {
  async getAll(): Promise<MarketingCampaign[]> {
    const supabase = createAdminClient();
    const rows = await selectAllPages<SupabaseCampaignRow>(
      (from, to) =>
        supabase
          .from("marketing_campaigns")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id", { ascending: true })
          .range(from, to),
      "getAll"
    );
    return rows.map(mapToDomain);
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("marketing_campaigns").select("*").eq("id", id).maybeSingle();
    check(error, "getById");
    if (!data) return null;

    const campaign = mapToDomain(data as SupabaseCampaignRow);
    const recipients = await this.getRecipientRows(id);
    // The relational table is the source of truth; the JSON column covers campaigns saved before it existed
    campaign.recipients = deduplicateRecipients(recipients.length > 0 ? recipients : campaign.recipients || []);
    return campaign;
  }

  async save(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    campaign.recipients = deduplicateRecipients(campaign.recipients || []);
    const supabase = createAdminClient();
    const { error } = await supabase.from("marketing_campaigns").upsert(mapToDbRow(campaign));
    check(error, "save");

    if (campaign.recipients.length > 0) {
      await this.saveRecipients(campaign.id, campaign.recipients);
    }
    return campaign;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = createAdminClient();
    // Recipients are removed by ON DELETE CASCADE
    const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
    check(error, "delete");
    return true;
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const recipients = await this.getRecipientRows(campaignId);
    if (recipients.length > 0) {
      return deduplicateRecipients(recipients);
    }
    const campaign = await this.getById(campaignId);
    return deduplicateRecipients(campaign?.recipients || []);
  }

  /**
   * Upserts the recipient rows, then removes customers no longer targeted. Never deletes first,
   * so a failure part-way leaves the previous recipients (and their SENT statuses) in place.
   */
  async saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void> {
    const uniqueRecipients = deduplicateRecipients(recipients);
    const supabase = createAdminClient();

    const rows: SupabaseRecipientRow[] = uniqueRecipients.map((r) => ({
      campaign_id: campaignId,
      customer_id: r.customerId,
      email: r.email,
      full_name: r.fullName,
      tier: r.tier,
      status: r.status,
      sent_at: r.sentAt || null,
      error: r.error || null,
    }));

    for (const chunk of chunks(rows)) {
      const { error } = await supabase
        .from("marketing_campaign_recipients")
        .upsert(chunk, { onConflict: "campaign_id,customer_id" });
      check(error, "saveRecipients (upsert)");
    }

    const kept = new Set(uniqueRecipients.map((r) => r.customerId));
    const existing = await selectAllPages<{ id: string; customer_id: string }>(
      (from, to) =>
        supabase
          .from("marketing_campaign_recipients")
          .select("id, customer_id")
          .eq("campaign_id", campaignId)
          .order("id", { ascending: true })
          .range(from, to),
      "saveRecipients (list)"
    );
    const staleIds = existing.filter((r) => !kept.has(r.customer_id)).map((r) => r.id);
    for (const chunk of chunks(staleIds)) {
      const { error } = await supabase.from("marketing_campaign_recipients").delete().in("id", chunk);
      check(error, "saveRecipients (remove stale)");
    }

    // Keep the campaign's JSON copy in sync (read by campaigns saved before the relational table)
    const { error } = await supabase
      .from("marketing_campaigns")
      .update({ recipients: uniqueRecipients, updated_at: new Date().toISOString() })
      .eq("id", campaignId);
    check(error, "saveRecipients (campaign copy)");
  }

  async getUnsubscribedEmails(): Promise<string[]> {
    const supabase = createAdminClient();
    const rows = await selectAllPages<{ email: string }>(
      (from, to) =>
        supabase.from("marketing_unsubscribes").select("email").order("email", { ascending: true }).range(from, to),
      "getUnsubscribedEmails"
    );
    return Array.from(new Set(rows.map((r) => r.email.toLowerCase().trim())));
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    if (!email) return false;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("marketing_unsubscribes")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .limit(1);
    check(error, "isUnsubscribed");
    return (data ?? []).length > 0;
  }

  async unsubscribe(email: string, reason?: string, customerId?: string): Promise<boolean> {
    if (!email) return false;
    const supabase = createAdminClient();
    const { error } = await supabase.from("marketing_unsubscribes").insert({
      email: email.toLowerCase().trim(),
      reason: reason || null,
      customer_id: customerId || null,
    });
    // Already unsubscribed: the unique index on lower(email) rejects the duplicate
    if (error?.code === UNIQUE_VIOLATION) return true;
    check(error, "unsubscribe");
    return true;
  }

  async resubscribe(email: string): Promise<boolean> {
    if (!email) return false;
    const supabase = createAdminClient();
    const { error } = await supabase.from("marketing_unsubscribes").delete().eq("email", email.toLowerCase().trim());
    check(error, "resubscribe");
    return true;
  }

  private async getRecipientRows(campaignId: string): Promise<CampaignRecipient[]> {
    const supabase = createAdminClient();
    const rows = await selectAllPages<SupabaseRecipientRow>(
      (from, to) =>
        supabase
          .from("marketing_campaign_recipients")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("id", { ascending: true })
          .range(from, to),
      "getRecipients"
    );
    return rows.map(mapRecipientToDomain);
  }
}

export const defaultMarketingRepo = new SupabaseMarketingRepository();
