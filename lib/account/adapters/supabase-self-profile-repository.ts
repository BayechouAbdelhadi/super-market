import type { SupabaseClient } from "@supabase/supabase-js";
import { ISelfProfileRepository, SelfLoyalty, SelfProfileRow, SelfTransaction } from "../ports";
import type { LoyaltyTier } from "@/lib/loyalty/types";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

/**
 * Infrastructure Adapter implementing ISelfProfileRepository with the caller's session client.
 */
export class SupabaseSelfProfileRepository implements ISelfProfileRepository {
  constructor(private readonly sb: SupabaseClient) {}

  async getProfile(userId: string): Promise<SelfProfileRow | null> {
    const { data } = await this.sb
      .from("profiles")
      .select("first_name, last_name, email, phone_number")
      .eq("id", userId)
      .maybeSingle();
    return (data as SelfProfileRow | null) ?? null;
  }

  async getLoyalty(userId: string): Promise<SelfLoyalty | null> {
    const { data } = await this.sb
      .from("customers")
      .select("loyalty_points, status")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      points: data.loyalty_points ?? 0,
      tier: (data.status as LoyaltyTier | null) ?? LOYALTY_CONFIG.defaults.tier,
    };
  }

  async listRecentTransactions(userId: string, limit: number): Promise<SelfTransaction[]> {
    const { data } = await this.sb
      .from("transactions")
      .select("id, amount_total, points_earned, points_redeemed, created_at")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as SelfTransaction[] | null) ?? [];
  }
}
