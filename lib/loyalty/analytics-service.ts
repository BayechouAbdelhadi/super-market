import { RealDashboardData, LiveFeedData } from "./analytics-types";
import {
  calculateRealKpis,
  aggregateDailySales,
  buildLiveOperations,
  getStartOfToday,
} from "./analytics-domain";
import { IAnalyticsRepository, AnalyticsProfileRow, AnalyticsCustomerRow } from "./ports";
import { SupabaseAnalyticsRepository } from "./adapters/supabase-analytics-repository";

const defaultAnalyticsRepo: IAnalyticsRepository = new SupabaseAnalyticsRepository();

/** Analytics window safety cap (rows) for the 7-day dashboard trend. */
const DASHBOARD_TRANSACTIONS_CAP = 5000;

async function loadUsersById(repo: IAnalyticsRepository, ids: string[]) {
  const { profiles, customers } = await repo.getUsersByIds(ids);
  return {
    profilesById: new Map<string, AnalyticsProfileRow>(profiles.map((p) => [p.id, p])),
    customersById: new Map<string, AnalyticsCustomerRow>(customers.map((c) => [c.id, c])),
  };
}

function isDynamicServerUsage(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && (err as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE";
}

/**
 * BFF Service to fetch and assemble real analytics directly from Supabase.
 * Optimized for high performance and zero memory bloat:
 * - Offloads counts to PostgreSQL (`head: true`)
 * - Limits queries to bounded date ranges (last 7 days) and paginated sets
 * - Avoids unbounded memory allocation in Node.js heap
 */
export async function getDashboardAnalytics(
  repo: IAnalyticsRepository = defaultAnalyticsRepo
): Promise<RealDashboardData> {
  try {
    const now = new Date();
    const todayStart = getStartOfToday(now);

    // Date boundary for 7-day trend (8 days ago start of day)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Fetch recent transactions bounded to the active analytics window (last 7 days + limit safety)
    const recentTransactions = await repo.getRecentTransactions({
      since: sevenDaysAgo,
      limit: DASHBOARD_TRANSACTIONS_CAP,
    });

    // 2. Fetch total count of all transactions using PostgreSQL count (zero payload memory)
    const totalSalesCount = await repo.countTransactions();

    // 3. Exact counts for customers & cashiers directly from database
    const totalClientsCount = await repo.countProfiles("CUSTOMER");
    const totalCashiersCount = await repo.countProfiles("CASHIER");
    const newClientsTodayCount = await repo.countProfiles("CUSTOMER", todayStart);

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
    const { profilesById, customersById } = await loadUsersById(repo, relevantUserIds);

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
  } catch (err) {
    if (isDynamicServerUsage(err)) {
      throw err;
    }
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
export async function getLiveFeedData(
  limit = 100,
  repo: IAnalyticsRepository = defaultAnalyticsRepo
): Promise<LiveFeedData> {
  try {
    const now = new Date();
    const todayStart = getStartOfToday(now);

    const txs = await repo.getRecentTransactions({ limit });

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

    const { profilesById, customersById } = await loadUsersById(repo, relevantUserIds);

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
  } catch (err) {
    if (isDynamicServerUsage(err)) {
      throw err;
    }
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
