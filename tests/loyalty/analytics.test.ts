import { describe, it, expect } from "vitest";
import {
  calculateRealKpis,
  aggregateDailySales,
  buildLiveOperations,
  formatCurrency,
  formatNumber,
  getStartOfToday,
} from "@/lib/loyalty/analytics-domain";

describe("Analytics Domain Logic (Zero Fake Data)", () => {
  const referenceDate = new Date("2026-10-08T14:30:00Z");

  it("calculates real KPIs correctly for today and total", () => {
    const rawTransactions = [
      // Today transaction 1
      {
        id: "tx-1",
        amount_total: 50.0,
        points_earned: 50,
        points_redeemed: 0,
        created_at: "2026-10-08T10:00:00Z",
      },
      // Today transaction 2 (Redeem)
      {
        id: "tx-2",
        amount_total: 0.0,
        points_earned: 0,
        points_redeemed: 100,
        created_at: "2026-10-08T11:00:00Z",
      },
      // Yesterday transaction
      {
        id: "tx-3",
        amount_total: 80.0,
        points_earned: 80,
        points_redeemed: 20,
        created_at: "2026-10-07T15:00:00Z",
      },
    ];

    const rawProfiles = [
      { id: "p-1", role: "CUSTOMER", created_at: "2026-10-08T09:00:00Z" }, // new today
      { id: "p-2", role: "CUSTOMER", created_at: "2026-10-07T12:00:00Z" }, // existing
      { id: "p-3", role: "CASHIER", created_at: "2026-10-08T08:00:00Z" }, // not a customer
    ];

    const kpis = calculateRealKpis(rawTransactions, rawProfiles, referenceDate);

    expect(kpis.caToday).toBe(50.0);
    expect(kpis.caTotal).toBe(130.0);
    expect(kpis.dailySalesCount).toBe(2);
    expect(kpis.totalSalesCount).toBe(3);
    expect(kpis.dailyPointsRedeemed).toBe(100);
    expect(kpis.totalPointsRedeemed).toBe(120);
    expect(kpis.dailyPointsEarned).toBe(50);
    expect(kpis.totalPointsEarned).toBe(130);
    expect(kpis.newClientsToday).toBe(1);
    expect(kpis.totalClients).toBe(2);
  });

  it("aggregates daily sales accurately without fake data", () => {
    const rawTransactions = [
      {
        amount_total: 100.0,
        points_earned: 100,
        points_redeemed: 0,
        created_at: "2026-10-08T12:00:00Z",
      },
      {
        amount_total: 50.0,
        points_earned: 50,
        points_redeemed: 0,
        created_at: "2026-10-08T14:00:00Z",
      },
      {
        amount_total: 30.0,
        points_earned: 30,
        points_redeemed: 10,
        created_at: "2026-10-07T12:00:00Z",
      },
    ];

    const daily = aggregateDailySales(rawTransactions, 7, referenceDate);

    expect(daily.length).toBe(7);
    const todayRecord = daily[daily.length - 1];
    expect(todayRecord.revenue).toBe(150.0);
    expect(todayRecord.salesCount).toBe(2);

    const yesterdayRecord = daily[daily.length - 2];
    expect(yesterdayRecord.revenue).toBe(30.0);
    expect(yesterdayRecord.salesCount).toBe(1);

    // Days with no transactions should be 0
    const olderRecord = daily[0];
    expect(olderRecord.revenue).toBe(0);
    expect(olderRecord.salesCount).toBe(0);
  });

  it("builds live operations cleanly", () => {
    const rawTransactions = [
      {
        id: "tx-1",
        customer_id: "c-1",
        cashier_id: "ca-1",
        amount_total: 45.5,
        points_earned: 45,
        points_redeemed: 0,
        created_at: "2026-10-08T12:00:00Z",
      },
    ];

    const profilesMap = new Map([
      ["c-1", { first_name: "Jean", last_name: "Dupont", email: "jean@dupont.fr", role: "CUSTOMER" }],
      ["ca-1", { first_name: "Sophie", last_name: "Marceau", email: "sophie@caisse.fr", role: "CASHIER" }],
    ]);

    const customersMap = new Map([
      ["c-1", { loyalty_points: 250, status: "SILVER" }],
    ]);

    const live = buildLiveOperations(rawTransactions, profilesMap, customersMap);

    expect(live.length).toBe(1);
    expect(live[0].customerName).toBe("Jean Dupont");
    expect(live[0].cashierName).toBe("Sophie Marceau");
    expect(live[0].customerTier).toBe("SILVER");
    expect(live[0].amount).toBe(45.5);
    expect(live[0].pointsEarned).toBe(45);
  });

  it("formats currency correctly", () => {
    expect(formatCurrency(1250.5).replace(/\s/g, " ")).toBe("1 250,50");
    expect(formatCurrency(0)).toBe("0,00");
  });
});
