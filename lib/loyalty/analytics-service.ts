import { RealDashboardData, LiveFeedData, DashboardKpis } from "./analytics-types";
import {
  buildDailySalesTrend,
  buildLiveOperations,
  getStartOfToday,
  getTrendWindowStart,
} from "./analytics-domain";
import { IAnalyticsRepository, AnalyticsProfileRow, AnalyticsCustomerRow, AnalyticsTransactionRow } from "./ports";
import { SupabaseAnalyticsRepository } from "./adapters/supabase-analytics-repository";
import { LOYALTY_CONFIG } from "./config";

const defaultAnalyticsRepo: IAnalyticsRepository = new SupabaseAnalyticsRepository();

const roundCents = (amount: number) => Math.round(amount * 100) / 100;

/** The server's timezone, so database day buckets match `getStartOfToday`. */
function serverTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

async function loadUsersById(repo: IAnalyticsRepository, ids: string[]) {
  const { profiles, customers } = await repo.getUsersByIds(ids);
  return {
    profilesById: new Map<string, AnalyticsProfileRow>(profiles.map((p) => [p.id, p])),
    customersById: new Map<string, AnalyticsCustomerRow>(customers.map((c) => [c.id, c])),
  };
}

async function loadLiveOperations(repo: IAnalyticsRepository, txs: AnalyticsTransactionRow[], limit: number) {
  const relevantUserIds = Array.from(
    new Set(
      txs
        .flatMap((t) => [t.customer_id, t.cashier_id])
        .filter((id): id is string => Boolean(id))
    )
  );
  const { profilesById, customersById } = await loadUsersById(repo, relevantUserIds);
  return buildLiveOperations(txs, profilesById, customersById, limit);
}

function isDynamicServerUsage(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && (err as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE";
}

const EMPTY_KPIS: DashboardKpis = {
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
};

/**
 * BFF Service assembling the admin dashboard. Every sum and count is computed by
 * PostgreSQL (RPC aggregates and exact counts); only the latest operations are loaded.
 */
export async function getDashboardAnalytics(
  repo: IAnalyticsRepository = defaultAnalyticsRepo
): Promise<RealDashboardData> {
  const { trendDays, dashboardLiveOperations } = LOYALTY_CONFIG.analytics;
  try {
    const now = new Date();
    const todayStart = getStartOfToday(now);

    const [totals, dayTotals, latestTxs, totalClients, totalCashiers, newClientsToday] = await Promise.all([
      repo.getTransactionTotals(todayStart),
      repo.getDailySales(getTrendWindowStart(trendDays, now), serverTimeZone()),
      repo.getRecentTransactions({ limit: dashboardLiveOperations }),
      repo.countProfiles("CUSTOMER"),
      repo.countProfiles("CASHIER"),
      repo.countProfiles("CUSTOMER", todayStart),
    ]);

    return {
      generatedAt: now.toISOString(),
      kpis: {
        caToday: roundCents(totals.revenueToday),
        caTotal: roundCents(totals.revenueTotal),
        dailySalesCount: totals.salesToday,
        totalSalesCount: totals.salesTotal,
        dailyPointsRedeemed: totals.pointsRedeemedToday,
        totalPointsRedeemed: totals.pointsRedeemedTotal,
        dailyPointsEarned: totals.pointsEarnedToday,
        totalPointsEarned: totals.pointsEarnedTotal,
        newClientsToday: newClientsToday ?? 0,
        totalClients: totalClients ?? 0,
      },
      dailySalesTrend: buildDailySalesTrend(dayTotals, trendDays, now),
      liveOperations: await loadLiveOperations(repo, latestTxs, dashboardLiveOperations),
      totalCashiersCount: totalCashiers ?? 0,
    };
  } catch (err) {
    if (isDynamicServerUsage(err)) {
      throw err;
    }
    console.error("[Analytics Service] Unexpected error in getDashboardAnalytics:", err);
    return {
      generatedAt: new Date().toISOString(),
      kpis: EMPTY_KPIS,
      dailySalesTrend: buildDailySalesTrend([], trendDays),
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

    const [txs, totals] = await Promise.all([
      repo.getRecentTransactions({ limit }),
      repo.getTransactionTotals(todayStart),
    ]);
    const operations = await loadLiveOperations(repo, txs, limit);

    return {
      generatedAt: now.toISOString(),
      operations,
      stats: {
        caToday: roundCents(totals.revenueToday),
        operationsToday: totals.salesToday,
        pointsEarnedToday: totals.pointsEarnedToday,
        pointsRedeemedToday: totals.pointsRedeemedToday,
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
