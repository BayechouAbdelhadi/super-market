/**
 * Central configuration for loyalty business rules, thresholds, and UI presets.
 * Modifying this file alters behavior across the domain, service, and UI layers.
 */

export const LOYALTY_CONFIG = {
  conversion: {
    // 1 Euro spent = 1 Loyalty Point (rounded down)
    euroToPointsRatio: 1,
    // 1 Loyalty Point = 0.05 Euro discount (e.g. 100 points = 5 €)
    pointValueInEuro: 0.05,
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
    redeemAmounts: [15, 30, 50, 100],
    // Quick loyalty point reduction presets
    redeemPoints: [50, 100, 250, 500],
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 50,
    tablePageSize: 5,
    // Accounts preloaded in back-office lists (customers, cashiers)
    backOfficeListLimit: 100,
    // Recent operations shown on the customer's own loyalty page
    selfRecentTransactions: 10,
    pageSizeOptions: [5, 10, 20, 50] as unknown as number[],
  },
  defaults: {
    cashierName: "Caisse #1",
    redeemReason: "Remise fidélité en caisse",
    // Tier assigned to every new loyalty account
    tier: "BRONZE" as const,
  },
  card: {
    // Prefix of the QR code shown on the digital loyalty card, followed by the customer id
    qrPrefix: "LOYALTY:",
    // Confirmation beep played when a card is scanned (checkout scanner style)
    scanBeep: { frequencyHz: 1800, durationMs: 120, volume: 0.25 },
  },
  search: {
    debounceMs: 300,
    minQueryLength: 1,
  },
  analytics: {
    // Days shown in the dashboard sales trend (today included)
    trendDays: 7,
    // Latest operations shown on the dashboard live feed
    dashboardLiveOperations: 25,
  },
} as const;
