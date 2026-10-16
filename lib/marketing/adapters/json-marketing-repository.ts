import fs from "fs";
import path from "path";
import { IMarketingCampaignRepository } from "../ports";
import { MarketingCampaign, CampaignRecipient } from "../types";
import { deduplicateRecipients } from "../utils";

const DATA_DIR = path.join(process.cwd(), "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "marketing-campaigns.json");

interface StorageData {
  campaigns: Record<string, MarketingCampaign>;
  recipients: Record<string, CampaignRecipient[]>;
  unsubscribes?: Record<string, { email: string; unsubscribedAt: string; reason?: string; customerId?: string }>;
}

export class JsonMarketingCampaignRepository implements IMarketingCampaignRepository {
  private ensureFile(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
      const initial: StorageData = { campaigns: {}, recipients: {}, unsubscribes: {} };
      fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    }
  }

  private readStorage(): StorageData {
    this.ensureFile();
    try {
      const raw = fs.readFileSync(CAMPAIGNS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        campaigns: parsed.campaigns || {},
        recipients: parsed.recipients || {},
        unsubscribes: parsed.unsubscribes || {},
      };
    } catch {
      return { campaigns: {}, recipients: {}, unsubscribes: {} };
    }
  }

  private writeStorage(data: StorageData): void {
    this.ensureFile();
    const tempFile = `${CAMPAIGNS_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, CAMPAIGNS_FILE);
  }

  async getAll(): Promise<MarketingCampaign[]> {
    const data = this.readStorage();
    return Object.values(data.campaigns).map((c) => ({
      ...c,
      recipients: deduplicateRecipients(data.recipients[c.id] || c.recipients || []),
    })).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    const data = this.readStorage();
    const campaign = data.campaigns[id];
    if (!campaign) return null;
    const recipients = deduplicateRecipients(data.recipients[id] || campaign.recipients || []);
    return { ...campaign, recipients };
  }

  async save(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    const data = this.readStorage();
    const { recipients, ...campaignHeader } = campaign;
    const cleanRecipients = deduplicateRecipients(recipients || []);
    data.campaigns[campaign.id] = { ...campaignHeader, recipients: cleanRecipients } as MarketingCampaign;
    data.recipients[campaign.id] = cleanRecipients;
    this.writeStorage(data);
    return { ...campaign, recipients: cleanRecipients };
  }

  async delete(id: string): Promise<boolean> {
    const data = this.readStorage();
    if (!data.campaigns[id]) return false;
    delete data.campaigns[id];
    delete data.recipients[id];
    this.writeStorage(data);
    return true;
  }

  async getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    const data = this.readStorage();
    return deduplicateRecipients(data.recipients[campaignId] || []);
  }

  async saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void> {
    const data = this.readStorage();
    data.recipients[campaignId] = deduplicateRecipients(recipients);
    this.writeStorage(data);
  }

  async getUnsubscribedEmails(): Promise<string[]> {
    const data = this.readStorage();
    return Object.keys(data.unsubscribes || {});
  }

  async isUnsubscribed(email: string): Promise<boolean> {
    if (!email) return false;
    const data = this.readStorage();
    const key = email.trim().toLowerCase();
    return Boolean(data.unsubscribes && data.unsubscribes[key]);
  }

  async unsubscribe(email: string, reason?: string, customerId?: string): Promise<boolean> {
    if (!email) return false;
    const data = this.readStorage();
    const key = email.trim().toLowerCase();
    if (!data.unsubscribes) data.unsubscribes = {};
    data.unsubscribes[key] = {
      email: key,
      customerId,
      reason,
      unsubscribedAt: new Date().toISOString(),
    };
    this.writeStorage(data);
    return true;
  }

  async resubscribe(email: string): Promise<boolean> {
    if (!email) return false;
    const data = this.readStorage();
    const key = email.trim().toLowerCase();
    if (data.unsubscribes && data.unsubscribes[key]) {
      delete data.unsubscribes[key];
      this.writeStorage(data);
    }
    return true;
  }
}

export const defaultMarketingRepo = new JsonMarketingCampaignRepository();
