import { RealDashboardData, LiveFeedData } from "./analytics-types";
import {
  calculateRealKpis,
  aggregateDailySales,
  buildLiveOperations,
  getStartOfToday,
} from "./analytics-domain";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * BFF Service to fetch and assemble real analytics directly from Supabase.
 * Optimized for high performance and zero memory bloat:
 * - Offloads counts to PostgreSQL (`head: true`)
 * - Limits queries to bounded date ranges (last 7 days) and paginated sets
 * - Avoids unbounded memory allocation in Node.js heap
 */
export async function getDashboardAnalytics(): Promise<RealDashboardData> {
  try {
    const sb = await createServerClient();
    const now = new Date();
    const todayStart = getStartOfToday(now);

    // Date boundary for 7-day trend (8 days ago start of day)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Fetch recent transactions bounded to the active analytics window (last 7 days + limit safety)
    const { data: rawRecentTransactions, error: txError } = await sb
      .from("transactions")
      .select("id, customer_id, cashier_id, amount_total, points_earned, points_redeemed, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (txError) {
      console.warn("[Analytics Service] Error fetching recent transactions:", txError.message);
    }

    // 2. Fetch total count of all transactions using PostgreSQL count (zero payload memory)
    const { count: totalSalesCount } = await sb
      .from("transactions")
      .select("*", { count: "exact", head: true });

    // 3. Exact counts for customers & cashiers directly from database
    const { count: totalClientsCount } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CUSTOMER");

    const { count: totalCashiersCount } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CASHIER");

    const { count: newClientsTodayCount } = await sb
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CUSTOMER")
      .gte("created_at", todayStart.toISOString());

    const recentTransactions = rawRecentTransactions || [];

    // 4. Calculate today's metrics from the recent transactions dataset
    let caToday = 0;
    let dailySalesCount = 0;
    let dailyPointsRedeemed = 0;
    let dailyPointsEarned = 0;

    let caTotal = 0;
    let totalPointsEarned = 0;
    let totalPointsRedeemed = 0;

    for (const t of recentTransactions) {
      const amount = Number(t.amount_total) || 0;
      const earned = Number(t.points_earned) || 0;
      const redeemed = Number(t.points_redeemed) || 0;
      const txDate = new Date(t.created_at);

      caTotal += amount;
      totalPointsEarned += earned;
      totalPointsRedeemed += redeemed;

      if (txDate >= todayStart) {
        caToday += amount;
        dailySalesCount += 1;
        dailyPointsRedeemed += redeemed;
        dailyPointsEarned += earned;
      }
    }

    // 5. Build live operations (latest 25 transactions)
    const latest25Txs = recentTransactions.slice(0, 25);
    const relevantUserIds = Array.from(
      new Set(
        latest25Txs
          .flatMap((t) => [t.customer_id, t.cashier_id])
          .filter((id): id is string => Boolean(id))
      )
    );

    // Fetch ONLY profiles involved in the latest 25 operations
    let profilesById = new Map<string, any>();
    let customersById = new Map<string, any>();

    if (relevantUserIds.length > 0) {
      const { data: relevantProfiles } = await sb
        .from("profiles")
        .select("id, first_name, last_name, email, role, created_at")
        .in("id", relevantUserIds);

      const { data: relevantCustomers } = await sb
        .from("customers")
        .select("id, loyalty_points, status")
        .in("id", relevantUserIds);

      profilesById = new Map((relevantProfiles || []).map((p) => [p.id, p]));
      customersById = new Map((relevantCustomers || []).map((c) => [c.id, c]));
    }

    // Aggregate real daily sales for the last 7 days
    const dailySalesTrend = aggregateDailySales(recentTransactions, 7, now);

    // Build real live operations feed
    const liveOperations = buildLiveOperations(
      latest25Txs,
      profilesById,
      customersById,
      25
    );

    const kpis = {
      caToday: Math.round(caToday * 100) / 100,
      caTotal: Math.round(caTotal * 100) / 100,
      dailySalesCount,
      totalSalesCount: totalSalesCount ?? recentTransactions.length,
      dailyPointsRedeemed,
      totalPointsRedeemed,
      dailyPointsEarned,
      totalPointsEarned,
      newClientsToday: newClientsTodayCount ?? 0,
      totalClients: totalClientsCount ?? 0,
    };

    return {
      generatedAt: now.toISOString(),
      kpis,
      dailySalesTrend,
      liveOperations,
      totalCashiersCount: totalCashiersCount ?? 0,
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

/**
 * BFF Service to fetch extended live operations feed for the dedicated live monitoring screen.
 * Offloads sorting and user retrieval with bounded queries.
 */
export async function getLiveFeedData(limit = 100): Promise<LiveFeedData> {
  try {
    const sb = await createServerClient();
    const now = new Date();
    const todayStart = getStartOfToday(now);

    const { data: rawTxs, error: txError } = await sb
      .from("transactions")
      .select("id, customer_id, cashier_id, amount_total, points_earned, points_redeemed, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (txError) {
      console.warn("[Analytics Service] Error fetching live feed transactions:", txError.message);
    }

    const txs = rawTxs || [];

    let caToday = 0;
    let operationsToday = 0;
    let pointsEarnedToday = 0;
    let pointsRedeemedToday = 0;

    for (const t of txs) {
      const txDate = new Date(t.created_at);
      if (txDate >= todayStart) {
        caToday += Number(t.amount_total) || 0;
        operationsToday += 1;
        pointsEarnedToday += Number(t.points_earned) || 0;
        pointsRedeemedToday += Number(t.points_redeemed) || 0;
      }
    }

    const relevantUserIds = Array.from(
      new Set(
        txs
          .flatMap((t) => [t.customer_id, t.cashier_id])
          .filter((id): id is string => Boolean(id))
      )
    );

    let profilesById = new Map<string, any>();
    let customersById = new Map<string, any>();

    if (relevantUserIds.length > 0) {
      const { data: relevantProfiles } = await sb
        .from("profiles")
        .select("id, first_name, last_name, email, role, created_at")
        .in("id", relevantUserIds);

      const { data: relevantCustomers } = await sb
        .from("customers")
        .select("id, loyalty_points, status")
        .in("id", relevantUserIds);

      profilesById = new Map((relevantProfiles || []).map((p) => [p.id, p]));
      customersById = new Map((relevantCustomers || []).map((c) => [c.id, c]));
    }

    const operations = buildLiveOperations(txs, profilesById, customersById, limit);

    return {
      generatedAt: now.toISOString(),
      operations,
      stats: {
        caToday: Math.round(caToday * 100) / 100,
        operationsToday,
        pointsEarnedToday,
        pointsRedeemedToday,
        totalLoaded: operations.length,
      },
    };
  } catch (err: any) {
    console.error("[Analytics Service] Unexpected error in getLiveFeedData:", err);
    return {
      generatedAt: new Date().toISOString(),
      operations: [],
      stats: {
        caToday: 0,
        operationsToday: 0,
        pointsEarnedToday: 0,
        pointsRedeemedToday: 0,
        totalLoaded: 0,
      },
    };
  }
}
