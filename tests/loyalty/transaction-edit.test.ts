import { describe, it, expect } from "vitest";
import { applyTransactionEdit, canEditTransaction } from "@/lib/loyalty/domain";
import { EditTransactionSchema } from "@/lib/loyalty/validation";

const rules = { minPointsToRedeem: 50, maxDiscountPerTransactionEuro: 0, pointValueInEuro: 0.05 };

describe("canEditTransaction", () => {
  const now = new Date("2026-10-23T10:00:00Z");

  it("lets admins edit any transaction", () => {
    expect(canEditTransaction("ADMIN", "2025-01-01T10:00:00Z", now)).toBe(true);
  });

  it("lets cashiers edit only today's transactions (Paris day)", () => {
    expect(canEditTransaction("CASHIER", "2026-10-23T08:00:00Z", now)).toBe(true);
    // 23:30 UTC on the 22nd is already the 23rd in Paris
    expect(canEditTransaction("CASHIER", "2026-10-22T22:30:00Z", now)).toBe(true);
    expect(canEditTransaction("CASHIER", "2026-10-22T20:00:00Z", now)).toBe(false);
  });

  it("refuses customers and invalid dates", () => {
    expect(canEditTransaction("CUSTOMER", "2026-10-23T08:00:00Z", now)).toBe(false);
    expect(canEditTransaction("CASHIER", "not-a-date", now)).toBe(false);
  });
});

describe("applyTransactionEdit", () => {
  it("moves balance and history by the points difference of a purchase", () => {
    const result = applyTransactionEdit(
      { amount: 100, pointsEarned: 100, pointsRedeemed: 0 },
      { amount: 10 },
      { availablePoints: 600, historicalPoints: 600 },
      1,
      { silver: 500, gold: 2000, vip: 5000 }
    );
    expect(result).toEqual({
      valid: true,
      pointsEarned: 10,
      pointsRedeemed: 0,
      available_points: 510,
      historical_points: 510,
      tier: "SILVER",
    });
  });

  it("refuses a purchase correction that would make the balance negative", () => {
    const result = applyTransactionEdit(
      { amount: 100, pointsEarned: 100, pointsRedeemed: 0 },
      { amount: 10 },
      { availablePoints: 20, historicalPoints: 100 },
      1
    );
    expect(result.valid).toBe(false);
  });

  it("refunds or charges the difference of a redemption, history unchanged", () => {
    const result = applyTransactionEdit(
      { amount: 30, pointsEarned: 0, pointsRedeemed: 200 },
      { amount: 30, pointsRedeemed: 100 },
      { availablePoints: 50, historicalPoints: 800 },
      1,
      undefined,
      rules
    );
    expect(result).toMatchObject({ valid: true, pointsEarned: 0, pointsRedeemed: 100, available_points: 150, historical_points: 800 });
  });

  it("keeps the redemption rules (discount cannot exceed the amount)", () => {
    const result = applyTransactionEdit(
      { amount: 30, pointsEarned: 0, pointsRedeemed: 100 },
      { amount: 2, pointsRedeemed: 100 },
      { availablePoints: 500, historicalPoints: 800 },
      1,
      undefined,
      rules
    );
    expect(result.valid).toBe(false);
  });
});

describe("EditTransactionSchema", () => {
  it("rejects negative amounts and non-integer points", () => {
    expect(EditTransactionSchema.safeParse({ amount: -1 }).success).toBe(false);
    expect(EditTransactionSchema.safeParse({ amount: 5, points_redeemed: 1.5 }).success).toBe(false);
    expect(EditTransactionSchema.safeParse({ amount: 5 }).success).toBe(true);
  });
});
