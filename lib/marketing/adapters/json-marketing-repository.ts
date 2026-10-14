import fs from "fs";
import path from "path";
import { IMarketingCampaignRepository } from "../ports";
import { MarketingCampaign, CampaignRecipient } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const CAMPAIGNS_FILE = path.join(DATA_DIR, "marketing-campaigns.json");

interface StorageData {
  campaigns: Record<string, MarketingCampaign>;
  recipients: Record<string, CampaignRecipient[]>;
}

export class JsonMarketingCampaignRepository implements IMarketingCampaignRepository {
  private ensureFile(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
      const initial: StorageData = { campaigns: {}, recipients: {} };
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
      };
    } catch {
      return { campaigns: {}, recipients: {} };
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
    return Object.values(data.campaigns).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getById(id: string): Promise<MarketingCampaign | null> {
    const data = this.readStorage();
    const campaign = data.campaigns[id];
    if (!campaign) return null;
    const recipients = data.recipients[id] || [];
    return { ...campaign, recipients };
  }

  async save(campaign: MarketingCampaign): Promise<MarketingCampaign> {
    const data = this.readStorage();
    const { recipients, ...campaignHeader } = campaign;
    data.campaigns[campaign.id] = campaignHeader as MarketingCampaign;
    if (recipients && Array.isArray(recipients)) {
      data.recipients[campaign.id] = recipients;
    }
    this.writeStorage(data);
    return campaign;
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
    return data.recipients[campaignId] || [];
  }

  async saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void> {
    const data = this.readStorage();
    data.recipients[campaignId] = recipients;
    this.writeStorage(data);
  }
}

export const defaultMarketingRepo = new JsonMarketingCampaignRepository();
