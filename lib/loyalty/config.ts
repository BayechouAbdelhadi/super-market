/**
 * Central configuration for loyalty business rules, thresholds, and UI presets.
 * Modifying this file alters behavior across the domain, service, and UI layers.
 */

export const LOYALTY_CONFIG = {
  conversion: {
    // 1 Euro spent = 1 Loyalty Point (rounded down)
    euroToPointsRatio: 1,
  },
  tiers: {
    BRONZE: {
      name: "BRONZE" as const,
      minHistoricalPoints: 0,
      label: "Bronze",
    },
    SILVER: {
      name: "SILVER" as const,
      minHistoricalPoints: 500,
      label: "Silver",
    },
    GOLD: {
      name: "GOLD" as const,
      minHistoricalPoints: 2000,
      label: "Gold",
    },
    VIP: {
      name: "VIP" as const,
      minHistoricalPoints: 5000,
      label: "VIP",
    },
  },
  presets: {
    // Standard purchase amounts proposed to cashiers
    purchaseAmounts: [12.5, 45.8, 75.5, 120.0],
    // Standard purchase amounts in redemption flow
    redeemAmounts: [0, 15, 30, 50, 100],
    // Quick loyalty point reduction presets
    redeemPoints: [50, 100, 250, 500],
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 50,
    tablePageSize: 5,
    pageSizeOptions: [5, 10, 20, 50] as unknown as number[],
  },
  defaults: {
    cashierName: "Caisse #1",
    redeemReason: "Remise fidélité en caisse",
  },
} as const;
