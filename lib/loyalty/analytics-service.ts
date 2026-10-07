import { RealDashboardData } from "./analytics-types";
import {
  calculateRealKpis,
  aggregateDailySales,
  buildLiveOperations,
} from "./analytics-domain";

async function getSupabaseServerClient() {
  const { createClient } = await import("@/lib/supabase/server");
  return await createClient();
}

/**
 * BFF Service to fetch and assemble real analytics directly from Supabase.
 * Zero mock or fake data — everything reflects the actual database state.
 */
export async function getDashboardAnalytics(): Promise<RealDashboardData> {
  try {
    const sb = await getSupabaseServerClient();

    // 1. Fetch real transactions from Supabase
    const { data: rawTransactions, error: txError } = await sb
      .from("transactions")
      .select("id, customer_id, cashier_id, amount_total, points_earned, points_redeemed, created_at")
      .order("created_at", { ascending: false });

    if (txError) {
      console.warn("[Analytics Service] Error fetching transactions:", txError.message);
    }

    // 2. Fetch real profiles from Supabase
    const { data: rawProfiles, error: profError } = await sb
      .from("profiles")
      .select("id, first_name, last_name, email, role, created_at");

    if (profError) {
      console.warn("[Analytics Service] Error fetching profiles:", profError.message);
    }

    // 3. Fetch real customers from Supabase
    const { data: rawCustomers, error: custError } = await sb
      .from("customers")
      .select("id, loyalty_points, status");

    if (custError) {
      console.warn("[Analytics Service] Error fetching customers:", custError.message);
    }

    const transactions = rawTransactions || [];
    const profiles = rawProfiles || [];
    const customers = rawCustomers || [];

    // Build lookup maps for fast live feed joining
    const profilesById = new Map(profiles.map((p) => [p.id, p]));
    const customersById = new Map(customers.map((c) => [c.id, c]));

    // Calculate real KPIs
    const kpis = calculateRealKpis(transactions, profiles);

    // Aggregate real daily sales for the last 7 days
    const dailySalesTrend = aggregateDailySales(transactions, 7);

    // Build real live operations feed
    const liveOperations = buildLiveOperations(
      transactions,
      profilesById,
      customersById,
      25
    );

    const totalCashiersCount = profiles.filter((p) => p.role === "CASHIER").length;

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      dailySalesTrend,
      liveOperations,
      totalCashiersCount,
    };
  } catch (err: any) {
    console.error("[Analytics Service] Unexpected error in getDashboardAnalytics:", err);
    return {
      generatedAt: new Date().toISOString(),
      kpis: {
        caToday: 0,
        caTotal: 0,
        dailySalesCount: 0,
        totalSalesCount: 0,
        dailyPointsRedeemed: 0,
        totalPointsRedeemed: 0,
        dailyPointsEarned: 0,
        totalPointsEarned: 0,
        newClientsToday: 0,
        totalClients: 0,
      },
      dailySalesTrend: aggregateDailySales([], 7),
      liveOperations: [],
      totalCashiersCount: 0,
    };
  }
}
