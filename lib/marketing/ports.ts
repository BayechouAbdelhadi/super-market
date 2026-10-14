import { MarketingCampaign, CampaignRecipient } from "./types";

export interface IMarketingCampaignRepository {
  getAll(): Promise<MarketingCampaign[]>;
  getById(id: string): Promise<MarketingCampaign | null>;
  save(campaign: MarketingCampaign): Promise<MarketingCampaign>;
  delete(id: string): Promise<boolean>;
  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void>;
}
