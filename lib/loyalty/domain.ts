import { LoyaltyTier } from "./types";

/**
 * Normalizes phone numbers to standard French 10-digit format (0X...)
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/**
 * 1 € = 1 loyalty point (rounded down)
 */
export function calculatePoints(amount: number): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  return Math.floor(amount);
}

/**
 * Calculates customer loyalty tier based on cumulative historical points
 * BRONZE: 0 - 499 pts
 * SILVER: 500 - 1999 pts
 * GOLD: 2000 - 4999 pts
 * VIP: 5000+ pts
 */
export function calculateTier(historicalPoints: number): LoyaltyTier {
  if (historicalPoints >= 5000) return "VIP";
  if (historicalPoints >= 2000) return "GOLD";
  if (historicalPoints >= 500) return "SILVER";
  return "BRONZE";
}

/**
 * Validates if customer has enough available points to redeem
 */
export function canRedeemPoints(availablePoints: number, pointsToRedeem: number): boolean {
  if (pointsToRedeem <= 0 || isNaN(pointsToRedeem)) return false;
  return availablePoints >= pointsToRedeem;
}

/**
 * Pure calculation for applying points from an earned purchase
 */
export function applyPurchasePoints(
  availablePoints: number,
  historicalPoints: number,
  pointsEarned: number,
) {
  const newAvailable = availablePoints + pointsEarned;
  const newHistorical = historicalPoints + pointsEarned;
  const newTier = calculateTier(newHistorical);
  return {
    available_points: newAvailable,
    historical_points: newHistorical,
    tier: newTier,
  };
}

/**
 * Pure calculation for redeeming points
 * Note: Historical points and tier NEVER decrease when points are spent!
 */
export function applyRedeemPoints(
  availablePoints: number,
  historicalPoints: number,
  pointsToRedeem: number,
) {
  if (!canRedeemPoints(availablePoints, pointsToRedeem)) {
    throw new Error("Opération refusée : solde disponible insuffisant.");
  }
  return {
    available_points: availablePoints - pointsToRedeem,
    historical_points: historicalPoints,
    tier: calculateTier(historicalPoints),
  };
}

/**
 * Pure customer search matcher
 */
export function matchCustomerQuery(
  customer: { first_name?: string; last_name?: string; email?: string; phone_number?: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const fn = (customer.first_name || "").toLowerCase();
  const ln = (customer.last_name || "").toLowerCase();
  const em = (customer.email || "").toLowerCase();
  const fullName1 = `${fn} ${ln}`.trim();
  const fullName2 = `${ln} ${fn}`.trim();
  const normalizedPhone = normalizePhone(customer.phone_number || "");
  const normalizedQ = normalizePhone(q);

  return (
    fn.includes(q) ||
    ln.includes(q) ||
    em.includes(q) ||
    fullName1.includes(q) ||
    fullName2.includes(q) ||
    (normalizedQ.length >= 3 && normalizedPhone.includes(normalizedQ))
  );
}

