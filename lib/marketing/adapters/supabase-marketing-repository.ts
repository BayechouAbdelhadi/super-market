import { createAdminClient } from "@/lib/supabase/admin";
import { IMarketingCampaignRepository } from "../ports";
import { MarketingCampaign, CampaignRecipient } from "../types";
import { defaultMarketingRepo as jsonFallbackRepo } from "./json-marketing-repository";

interface SupabaseCampaignRow {
  id: string;
  title: string;
  status: string;
  target_tiers: string[];
  dispatch_mode: string;
  daily_limit: number | null;
  start_date: string;
  end_date: string;
  last_run_date: string | null;
  subject: string;
  content: string;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  stats: any;
  recipients?: any[];
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
    status: row.status as any,
    targetTiers: (row.target_tiers || []) as any,
    dispatchMode: row.dispatch_mode as any,
    dailyLimit: row.daily_limit,
    startDate: row.start_date,
    endDate: row.end_date,
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
    tier: row.tier as any,
    status: row.status as any,
    sentAt: row.sent_at || undefined,
    error: row.error || undefined,
  };
}

export class SupabaseMarketingRepository implements IMarketingCampaignRepository {
  private hasDedicatedTable: boolean | null = null;

  /**
   * Detects whether dedicated `marketing_campaigns` table exists in Supabase.
   */
  private async isDedicatedTableAvailable(): Promise<boolean> {
    if (this.hasDedicatedTable !== null) {
      return this.hasDedicatedTable;
    }

    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("marketing_campaigns")
        .select("id")
        .limit(1);

      if (error && (error.code === "PGRST205" || error.code === "42P01")) {
        this.hasDedicatedTable = false;
      } else {
        this.hasDedicatedTable = true;
      }
    } catch {
      this.hasDedicatedTable = false;
    }

    return this.hasDedicatedTable;
  }

  // =========================================================================
  // Fallback storage using Supabase app_settings table (id: 'marketing_campaigns')
  // =========================================================================

  private async getFromAppSettings(): Promise<MarketingCampaign[]> {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("app_settings")
        .select("settings_json")
        .eq("id", "marketing_campaigns")
        .maybeSingle();

      if (!error && data?.settings_json?.campaigns) {
        return data.settings_json.campaigns as MarketingCampaign[];
      }
    } catch (err) {
      console.warn("[SupabaseMarketingRepo] Failed reading from app_settings fallback:", err);
    }

    return await jsonFallbackRepo.getAll();
  }

  private async saveToAppSettings(campaigns: MarketingCampaign[]): Promise<void> {
    try {
      const supabase = createAdminClient();
      await supabase.from("app_settings").upsert({
        id: "marketing_campaigns",
        settings_json: { campaigns },
        updated_at: new Date().toISOString(),
        updated_by: "system",
      });
    } catch (err) {
      console.warn("[SupabaseMarketingRepo] Failed writing to app_settings fallback:", err);
    }
  }

  // =========================================================================
  // IMarketingCampaignRepository Implementation
  // =========================================================================

  async getAll(): Promise<MarketingCampaign[]> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("marketing_campaigns")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return (data as SupabaseCampaignRow[]).map(mapToDomain);
        }
      } catch (err) {
        console.error("[SupabaseMarketingRepo] Error in getAll():", err);
      }
    }

    // Fallback via Supabase app_settings
    return await this.getFromAppSettings();
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("marketing_campaigns")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          const campaign = mapToDomain(data as SupabaseCampaignRow);

          // Fetch relational recipients if available
          try {
            const { data: recData, error: recError } = await supabase
              .from("marketing_campaign_recipients")
              .select("*")
              .eq("campaign_id", id);

            if (!recError && recData && recData.length > 0) {
              campaign.recipients = (recData as SupabaseRecipientRow[]).map(mapRecipientToDomain);
            }
          } catch {
            // Keep JSON recipients already mapped on the campaign
          }

          return campaign;
        }
      } catch (err) {
        console.error("[SupabaseMarketingRepo] Error in getById():", err);
      }
    }

    // Fallback
    const fromJson = await jsonFallbackRepo.getById(id);
    if (fromJson) return fromJson;
    const all = await this.getFromAppSettings();
    return all.find((c) => c.id === id) || null;
  }

  async save(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        const row = mapToDbRow(campaign);

        const { error } = await supabase.from("marketing_campaigns").upsert(row);

        if (!error) {
          if (campaign.recipients && campaign.recipients.length > 0) {
            await this.saveRecipients(campaign.id, campaign.recipients);
          }
          // Also sync to fallback store
          const current = await this.getFromAppSettings();
          const filtered = current.filter((c) => c.id !== campaign.id);
          await this.saveToAppSettings([campaign, ...filtered]);
          await jsonFallbackRepo.save(campaign);
          return campaign;
        }
      } catch (err) {
        console.error("[SupabaseMarketingRepo] Error in save():", err);
      }
    }

    // Fallback: save to Supabase app_settings and local JSON
    const current = await this.getFromAppSettings();
    const filtered = current.filter((c) => c.id !== campaign.id);
    const updatedList = [campaign, ...filtered];

    await this.saveToAppSettings(updatedList);
    await jsonFallbackRepo.save(campaign);

    return campaign;
  }

  async delete(id: string): Promise<boolean> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        await supabase.from("marketing_campaign_recipients").delete().eq("campaign_id", id);
        const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
        if (!error) {
          const current = await this.getFromAppSettings();
          await this.saveToAppSettings(current.filter((c) => c.id !== id));
          await jsonFallbackRepo.delete(id);
          return true;
        }
      } catch (err) {
        console.error("[SupabaseMarketingRepo] Error in delete():", err);
      }
    }

    // Fallback
    const current = await this.getFromAppSettings();
    const updatedList = current.filter((c) => c.id !== id);
    await this.saveToAppSettings(updatedList);
    await jsonFallbackRepo.delete(id);
    return true;
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("marketing_campaign_recipients")
          .select("*")
          .eq("campaign_id", campaignId);

        if (!error && data && data.length > 0) {
          return (data as SupabaseRecipientRow[]).map(mapRecipientToDomain);
        }
      } catch (err) {
        console.warn("[SupabaseMarketingRepo] Recipient fetch fallback to campaign json:", err);
      }
    }

    const fromJsonRecs = await jsonFallbackRepo.getRecipients(campaignId);
    if (fromJsonRecs && fromJsonRecs.length > 0) {
      return fromJsonRecs;
    }

    const campaign = await this.getById(campaignId);
    return campaign?.recipients || [];
  }

  async saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void> {
    const isAvailable = await this.isDedicatedTableAvailable();

    if (isAvailable) {
      try {
        const supabase = createAdminClient();
        const rows: SupabaseRecipientRow[] = recipients.map((r) => ({
          campaign_id: campaignId,
          customer_id: r.customerId,
          email: r.email,
          full_name: r.fullName,
          tier: r.tier,
          status: r.status,
          sent_at: r.sentAt || null,
          error: r.error || null,
        }));

        // Batch upsert to relational table
        await supabase.from("marketing_campaign_recipients").upsert(rows);

        // Also update JSON on the parent campaign
        await supabase
          .from("marketing_campaigns")
          .update({
            recipients,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaignId);
        return;
      } catch (err) {
        console.warn("[SupabaseMarketingRepo] Error in saveRecipients, fallback to app_settings:", err);
      }
    }

    // Fallback
    await jsonFallbackRepo.saveRecipients(campaignId, recipients);
    const campaign = await this.getById(campaignId);
    if (campaign) {
      campaign.recipients = recipients;
      await this.save(campaign);
    }
  }
}

export const defaultMarketingRepo = new SupabaseMarketingRepository();
