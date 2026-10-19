import { describe, it, expect } from "vitest";
import { getDashboardAnalytics } from "@/lib/loyalty/analytics-service";
import type { IAnalyticsRepository, TransactionTotals } from "@/lib/loyalty/ports";

const totals: TransactionTotals = {
  revenueToday: 50.005,
  salesToday: 2,
  pointsEarnedToday: 50,
  pointsRedeemedToday: 100,
  revenueTotal: 12450.5,
  salesTotal: 830,
  pointsEarnedTotal: 12000,
  pointsRedeemedTotal: 3000,
};

function fakeRepo(overrides: Partial<IAnalyticsRepository> = {}): IAnalyticsRepository {
  return {
    getRecentTransactions: async () => [],
    getTransactionTotals: async () => totals,
    getDailySales: async () => [],
    countProfiles: async (role, since) => (role === "CASHIER" ? 3 : since ? 4 : 210),
    getUsersByIds: async () => ({ profiles: [], customers: [] }),
    ...overrides,
  };
}

describe("getDashboardAnalytics", () => {
  it("maps database totals to KPIs, all-time totals included", async () => {
    const data = await getDashboardAnalytics(fakeRepo());

    expect(data.kpis).toEqual({
      caToday: 50.01,
      caTotal: 12450.5,
      dailySalesCount: 2,
      totalSalesCount: 830,
      dailyPointsRedeemed: 100,
      totalPointsRedeemed: 3000,
      dailyPointsEarned: 50,
      totalPointsEarned: 12000,
      newClientsToday: 4,
      totalClients: 210,
    });
    expect(data.totalCashiersCount).toBe(3);
    expect(data.dailySalesTrend).toHaveLength(7);
  });

  it("returns empty KPIs when the database aggregate fails", async () => {
    const data = await getDashboardAnalytics(
      fakeRepo({ getTransactionTotals: async () => { throw new Error("rpc missing"); } })
    );
    expect(data.kpis.caTotal).toBe(0);
    expect(data.liveOperations).toEqual([]);
  });
});
