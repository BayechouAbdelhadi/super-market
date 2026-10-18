import {
  AnalyticsCustomerRow,
  AnalyticsProfileRow,
  AnalyticsTransactionRow,
  IAnalyticsRepository,
} from "../ports";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Infrastructure Adapter implementing IAnalyticsRepository via Supabase (caller's RLS session).
 */
export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  async getRecentTransactions(options: { since?: Date; limit: number }): Promise<AnalyticsTransactionRow[]> {
    const sb = await createServerClient();
    let query = sb
      .from("transactions")
      .select("id, customer_id, cashier_id, amount_total, points_earned, points_redeemed, created_at");

    if (options.since) {
      query = query.gte("created_at", options.since.toISOString());
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(options.limit);

    if (error) {
      console.warn("[Analytics Repository] Error fetching transactions:", error.message);
    }
    return (data as AnalyticsTransactionRow[] | null) || [];
  }

  async countTransactions(): Promise<number | null> {
    const sb = await createServerClient();
    const { count } = await sb.from("transactions").select("*", { count: "exact", head: true });
    return count;
  }

  async countProfiles(role: string, since?: Date): Promise<number | null> {
    const sb = await createServerClient();
    let query = sb.from("profiles").select("*", { count: "exact", head: true }).eq("role", role);
    if (since) {
      query = query.gte("created_at", since.toISOString());
    }
    const { count } = await query;
    return count;
  }

  async getUsersByIds(ids: string[]): Promise<{ profiles: AnalyticsProfileRow[]; customers: AnalyticsCustomerRow[] }> {
    if (ids.length === 0) {
      return { profiles: [], customers: [] };
    }

    const sb = await createServerClient();
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, first_name, last_name, email, role, created_at")
      .in("id", ids);

    const { data: customers } = await sb
      .from("customers")
      .select("id, loyalty_points, status")
      .in("id", ids);

    return {
      profiles: (profiles as AnalyticsProfileRow[] | null) || [],
      customers: (customers as AnalyticsCustomerRow[] | null) || [],
    };
  }
}
