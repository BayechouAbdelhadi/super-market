import { LoyaltyTier } from "@/lib/loyalty/types";

export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type DispatchMode = "ALL_AT_ONCE" | "DAILY_LIMIT";

export type RecipientStatus = "PENDING" | "SENT" | "FAILED";

export interface CampaignRecipient {
  customerId: string;
  email: string;
  fullName: string;
  tier: LoyaltyTier;
  status: RecipientStatus;
  sentAt?: string;
  error?: string;
}

export interface CampaignStats {
  totalTargets: number;
  sentCount: number;
  failedCount: number;
  remainingCount: number;
  progressPercentage: number;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  status: CampaignStatus;
  // Step 1: Target categories
  targetTiers: LoyaltyTier[];
  // Step 2: Dispatch mode
  dispatchMode: DispatchMode;
  dailyLimit: number | null; // e.g. 100/day
  // Step 3: Schedule
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm format, defaults to "00:00" (minuit)
  lastRunDate: string | null; // YYYY-MM-DD
  // Step 4: Content
  subject: string;
  content: string; // text or markdown description of the offer
  imageUrl: string | null;
  ctaText?: string;
  ctaUrl?: string;
  // Metadata & Tracking
  stats: CampaignStats;
  recipients: CampaignRecipient[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy?: string;
}

export interface CreateCampaignInput {
  title: string;
  targetTiers: LoyaltyTier[];
  dispatchMode: DispatchMode;
  dailyLimit?: number | null;
  startDate: string;
  endDate: string;
  scheduledTime?: string; // HH:mm, defaults to "00:00" (minuit)
  subject: string;
  content: string;
  imageUrl?: string | null;
  ctaText?: string;
  ctaUrl?: string;
}

export interface ProcessBatchResult {
  campaignId: string;
  processedCount: number;
  sentInBatch: number;
  failedInBatch: number;
  newStatus: CampaignStatus;
  stats: CampaignStats;
}
