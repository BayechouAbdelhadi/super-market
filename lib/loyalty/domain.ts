import { LoyaltyTier } from "./types";
import { LOYALTY_CONFIG } from "./config";

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

export interface TierThresholds {
  silver?: number;
  gold?: number;
  vip?: number;
}

export interface RedemptionRulesConfig {
  minPointsToRedeem?: number;
  maxDiscountPerTransactionEuro?: number;
  pointValueInEuro?: number;
}

/**
 * Calculates points earned from purchase amount using configured ratio (rounded down)
 */
export function calculatePoints(
  amount: number,
  ratio: number = LOYALTY_CONFIG.conversion.euroToPointsRatio
): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  if (Number.isInteger(ratio)) {
    return Math.floor(amount * ratio);
  }
  return Math.round(amount * ratio);
}

/**
 * Calculates customer loyalty tier based on cumulative historical points and configured thresholds
 */
export function calculateTier(
  historicalPoints: number,
  tiers?: TierThresholds
): LoyaltyTier {
  const vipMin = tiers?.vip ?? LOYALTY_CONFIG.tiers.VIP.minHistoricalPoints;
  const goldMin = tiers?.gold ?? LOYALTY_CONFIG.tiers.GOLD.minHistoricalPoints;
  const silverMin = tiers?.silver ?? LOYALTY_CONFIG.tiers.SILVER.minHistoricalPoints;

  if (historicalPoints >= vipMin) return "VIP";
  if (historicalPoints >= goldMin) return "GOLD";
  if (historicalPoints >= silverMin) return "SILVER";
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
 * Validates business rules for points redemption (minimum threshold, maximum euro discount, balance).
 */
export function validateRedemption(
  pointsToRedeem: number,
  availablePoints: number,
  rules?: RedemptionRulesConfig
): { valid: boolean; error?: string } {
  if (pointsToRedeem <= 0 || isNaN(pointsToRedeem)) {
    return { valid: false, error: "Veuillez saisir un nombre de points valide supérieur à 0." };
  }
  if (!canRedeemPoints(availablePoints, pointsToRedeem)) {
    return {
      valid: false,
      error: "Opération refusée : solde disponible insuffisant.",
    };
  }

  const minPoints = rules?.minPointsToRedeem ?? 0;
  if (minPoints > 0 && pointsToRedeem < minPoints) {
    return {
      valid: false,
      error: `Seuil minimum non atteint : un minimum de ${minPoints} points est requis pour utiliser une remise.`,
    };
  }

  const maxDiscountEuro = rules?.maxDiscountPerTransactionEuro ?? 0;
  const pointValue = rules?.pointValueInEuro ?? LOYALTY_CONFIG.conversion.pointValueInEuro;
  if (maxDiscountEuro > 0) {
    const discountEuro = pointsToRedeem * pointValue;
    if (discountEuro > maxDiscountEuro) {
      const maxAllowedPoints = Math.floor(maxDiscountEuro / pointValue);
      return {
        valid: false,
        error: `La remise maximale autorisée par passage en caisse est de ${maxDiscountEuro.toFixed(2)} € (soit un maximum de ${maxAllowedPoints} points).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Pure calculation for applying points from an earned purchase
 */
export function applyPurchasePoints(
  availablePoints: number,
  historicalPoints: number,
  pointsEarned: number,
  tiers?: TierThresholds
) {
  const newAvailable = availablePoints + pointsEarned;
  const newHistorical = historicalPoints + pointsEarned;
  const newTier = calculateTier(newHistorical, tiers);
  return {
    available_points: newAvailable,
    historical_points: newHistorical,
    tier: newTier,
  };
}

/**
 * Calculates points earned during a redemption transaction.
 * Pure business rule: When redeeming points, the customer is consuming rewards,
 * so points earned is ALWAYS strictly 0, regardless of the purchase amount (even if > 0).
 */
export function calculateRedemptionPointsEarned(_purchaseAmount: number): number {
  return 0;
}

/**
 * Pure calculation for redeeming points
 * Note: Historical points and tier NEVER change when points are spent!
 * Points earned is strictly 0 because the customer is consuming rewards.
 */
export function applyRedeemPoints(
  availablePoints: number,
  historicalPoints: number,
  pointsToRedeem: number,
  tiers?: TierThresholds,
  rules?: RedemptionRulesConfig
) {
  const validation = validateRedemption(pointsToRedeem, availablePoints, rules);
  if (!validation.valid) {
    throw new Error(validation.error || "Opération refusée : solde disponible insuffisant.");
  }
  return {
    available_points: availablePoints - pointsToRedeem,
    historical_points: historicalPoints,
    tier: calculateTier(historicalPoints, tiers),
    points_earned: 0,
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

