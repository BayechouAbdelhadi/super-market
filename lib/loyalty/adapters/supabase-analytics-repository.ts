import {
  AnalyticsCustomerRow,
  AnalyticsProfileRow,
  AnalyticsTransactionRow,
  DailySalesTotals,
  IAnalyticsRepository,
  TransactionTotals,
} from "../ports";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Numeric and bigint columns may arrive as strings from PostgREST
type DbNumber = number | string;

interface TransactionTotalsRow {
  revenue_today: DbNumber;
  sales_today: DbNumber;
  points_earned_today: DbNumber;
  points_redeemed_today: DbNumber;
  revenue_total: DbNumber;
  sales_total: DbNumber;
  points_earned_total: DbNumber;
  points_redeemed_total: DbNumber;
}

interface DailySalesRow {
  day: string;
  revenue: DbNumber;
  sales_count: DbNumber;
  points_earned: DbNumber;
  points_redeemed: DbNumber;
}

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

  async getTransactionTotals(todayStart: Date): Promise<TransactionTotals> {
    const sb = await createServerClient();
    const { data, error } = await sb
      .rpc("dashboard_transaction_totals", { p_today_start: todayStart.toISOString() })
      .single<TransactionTotalsRow>();
    if (error || !data) {
      throw new Error(`dashboard_transaction_totals failed: ${error?.message ?? "no row"}`);
    }
    return {
      revenueToday: Number(data.revenue_today),
      salesToday: Number(data.sales_today),
      pointsEarnedToday: Number(data.points_earned_today),
      pointsRedeemedToday: Number(data.points_redeemed_today),
      revenueTotal: Number(data.revenue_total),
      salesTotal: Number(data.sales_total),
      pointsEarnedTotal: Number(data.points_earned_total),
      pointsRedeemedTotal: Number(data.points_redeemed_total),
    };
  }

  async getDailySales(since: Date, timeZone: string): Promise<DailySalesTotals[]> {
    const sb = await createServerClient();
    const { data, error } = await sb
      .rpc("dashboard_daily_sales", { p_since: since.toISOString(), p_tz: timeZone });
    if (error) {
      throw new Error(`dashboard_daily_sales failed: ${error.message}`);
    }
    return ((data as DailySalesRow[] | null) ?? []).map((row) => ({
      date: row.day,
      revenue: Number(row.revenue),
      salesCount: Number(row.sales_count),
      pointsEarned: Number(row.points_earned),
      pointsRedeemed: Number(row.points_redeemed),
    }));
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
