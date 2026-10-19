import type { LoyaltyTier } from "@/lib/loyalty/types";

export interface SelfProfileRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface SelfLoyalty {
  points: number;
  tier: LoyaltyTier;
}

export interface SelfTransaction {
  id: string;
  amount_total: number | null;
  points_earned: number | null;
  points_redeemed: number | null;
  created_at: string;
}

/**
 * Domain Port: the signed-in user's own account data (RLS-scoped to the caller).
 */
export interface ISelfProfileRepository {
  getProfile(userId: string): Promise<SelfProfileRow | null>;
  getLoyalty(userId: string): Promise<SelfLoyalty | null>;
  listRecentTransactions(userId: string, limit: number): Promise<SelfTransaction[]>;
}
