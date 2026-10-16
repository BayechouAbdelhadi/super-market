import { MarketingCampaign, CampaignRecipient } from "./types";

export interface IMarketingCampaignRepository {
  getAll(): Promise<MarketingCampaign[]>;
  getById(id: string): Promise<MarketingCampaign | null>;
  save(campaign: MarketingCampaign): Promise<MarketingCampaign>;
  delete(id: string): Promise<boolean>;
  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void>;

  // Unsubscribe & Opt-Out operations
  getUnsubscribedEmails(): Promise<string[]>;
  isUnsubscribed(email: string): Promise<boolean>;
  unsubscribe(email: string, reason?: string, customerId?: string): Promise<boolean>;
  resubscribe(email: string): Promise<boolean>;
}
