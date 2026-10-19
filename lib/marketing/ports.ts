import { MarketingCampaign, CampaignRecipient } from "./types";

export interface IMarketingCampaignRepository {
  getAll(): Promise<MarketingCampaign[]>;
  getById(id: string): Promise<MarketingCampaign | null>;
  save(campaign: MarketingCampaign): Promise<MarketingCampaign>;
  delete(id: string): Promise<boolean>;
  getRecipients(campaignId: string): Promise<CampaignRecipient[]>;
  saveRecipients(campaignId: string, recipients: CampaignRecipient[]): Promise<void>;

  /**
   * Atomically claims the campaign for a batch run, for `leaseSeconds`.
   * Returns false when another run holds an unexpired claim.
   */
  tryLock(campaignId: string, leaseSeconds: number): Promise<boolean>;
  /** Releases the claim taken by tryLock. */
  unlock(campaignId: string): Promise<void>;

  // Unsubscribe & Opt-Out operations
  getUnsubscribedEmails(): Promise<string[]>;
  isUnsubscribed(email: string): Promise<boolean>;
  unsubscribe(email: string, reason?: string, customerId?: string): Promise<boolean>;
  resubscribe(email: string): Promise<boolean>;
}

/** Customer with an email address, as needed to build a campaign audience. */
export interface AudienceCustomerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  customers: { loyalty_points: number | null; status: string | null } | { loyalty_points: number | null; status: string | null }[] | null;
}

/**
 * Domain Port: read access to the customers a campaign can target.
 */
export interface ICampaignAudienceRepository {
  /** All customers that have an email address (read page by page, bounded queries). */
  listCustomersWithEmail(): Promise<AudienceCustomerRow[]>;
}
