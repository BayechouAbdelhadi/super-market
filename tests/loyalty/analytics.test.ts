import { describe, it, expect } from "vitest";
import {
  buildDailySalesTrend,
  toLocalDateKey,
  buildLiveOperations,
  formatCurrency,
} from "@/lib/loyalty/analytics-domain";

describe("Analytics Domain Logic (Zero Fake Data)", () => {
  const referenceDate = new Date("2026-10-08T14:30:00Z");

  it("lays database day totals onto the last 7 days", () => {
    const today = new Date(referenceDate);
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const daily = buildDailySalesTrend(
      [
        { date: toLocalDateKey(today), revenue: 150.004, salesCount: 2, pointsEarned: 150, pointsRedeemed: 0 },
        { date: toLocalDateKey(yesterday), revenue: 30, salesCount: 1, pointsEarned: 30, pointsRedeemed: 10 },
      ],
      7,
      referenceDate
    );

    expect(daily.length).toBe(7);
    const todayRecord = daily[daily.length - 1];
    expect(todayRecord.date).toBe(toLocalDateKey(today));
    expect(todayRecord.revenue).toBe(150.0);
    expect(todayRecord.salesCount).toBe(2);

    const yesterdayRecord = daily[daily.length - 2];
    expect(yesterdayRecord.revenue).toBe(30.0);
    expect(yesterdayRecord.pointsRedeemed).toBe(10);

    // Days with no transactions should be 0
    expect(daily[0].revenue).toBe(0);
    expect(daily[0].salesCount).toBe(0);
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
