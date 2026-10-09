import {
  CustomerDetail,
  CustomerSummary,
  LoyaltyTier,
  Transaction,
  MovementRecord,
  CreateCustomerInput,
} from "./types";
import { ICustomerRepository, ITransactionRepository } from "./ports";
import { SupabaseCustomerRepository } from "./adapters/supabase-customer-repository";
import { SupabaseTransactionRepository } from "./adapters/supabase-transaction-repository";
import { LOYALTY_CONFIG } from "./config";

import {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
  calculateRedemptionPointsEarned,
} from "./domain";

export {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
  calculateRedemptionPointsEarned,
};

// Default repository instances wired to infrastructure adapters (Dependency Injection defaults)
const defaultCustomerRepo: ICustomerRepository = new SupabaseCustomerRepository();
const defaultTransactionRepo: ITransactionRepository = new SupabaseTransactionRepository();

/**
 * Searches customers by name, phone, or email via the Customer Port.
 */
export async function searchCustomers(
  query: string,
  customerRepo: ICustomerRepository = defaultCustomerRepo
): Promise<CustomerSummary[]> {
  return await customerRepo.search(query);
}

/**
 * Retrieves full customer detail and historical purchases via the Customer Port.
 */
export async function getCustomerDetail(
  customerId: string,
  customerRepo: ICustomerRepository = defaultCustomerRepo
): Promise<CustomerDetail | null> {
  return await customerRepo.getById(customerId);
}

export type CreateCustomerResult =
  | { success: true; customer: CustomerDetail }
  | {
      success: false;
      isDuplicate?: boolean;
      field?: "email" | "phone";
      message?: string;
      existingCustomer?: CustomerSummary;
      error: string;
    };

/**
 * Registers a new customer while preventing duplicate emails and phones.
 */
export async function createCustomer(
  data: CreateCustomerInput,
  customerRepo: ICustomerRepository = defaultCustomerRepo
): Promise<CreateCustomerResult> {
  const existingEmail = await customerRepo.findByEmail(data.email);
  if (existingEmail) {
    const existing = await customerRepo.getById(existingEmail.id);
    return {
      success: false,
      isDuplicate: true,
      field: "email",
      message: "Un client avec cette adresse email existe déjà.",
      existingCustomer: existing || undefined,
      error: "Un client avec cette adresse email existe déjà.",
    };
  }

  const existingPhone = await customerRepo.findByPhone(data.phone);
  if (existingPhone) {
    const existing = await customerRepo.getById(existingPhone.id);
    return {
      success: false,
      isDuplicate: true,
      field: "phone",
      message: "Un client avec ce numéro de téléphone existe déjà.",
      existingCustomer: existing || undefined,
      error: "Un client avec ce numéro de téléphone existe déjà.",
    };
  }

  try {
    const created = await customerRepo.createAuthAndProfile(data);
    const detail = await customerRepo.getById(created.id);
    if (!detail) {
      return { success: false, error: "Impossible de récupérer la fiche client après création." };
    }
    return { success: true, customer: detail };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur de création du compte client." };
  }
}

export type RecordPurchaseResult =
  | {
      success: true;
      transaction: Transaction;
      purchase: Transaction;
      movement?: MovementRecord;
      customer: CustomerDetail;
    }
  | { success: false; error: string };

/**
 * Records a customer purchase, calculates earned points, and updates loyalty tier.
 */
export async function recordPurchase(
  customerId: string,
  amount: number,
  cashierId: string | null,
  customerRepo: ICustomerRepository = defaultCustomerRepo,
  txRepo: ITransactionRepository = defaultTransactionRepo
): Promise<RecordPurchaseResult> {
  const detailBefore = await customerRepo.getById(customerId);
  if (!detailBefore) {
    return { success: false, error: "Client introuvable." };
  }

  const pointsEarned = calculatePoints(amount);

  try {
    const tx = await txRepo.create({
      customerId,
      cashierId,
      amount,
      pointsEarned,
      pointsRedeemed: 0,
    });

    const updated = applyPurchasePoints(
      detailBefore.available_points,
      detailBefore.historical_points,
      pointsEarned
    );

    await customerRepo.updateLoyaltyPoints(customerId, updated.available_points, updated.tier);
    const updatedDetail = await customerRepo.getById(customerId);

    return {
      success: true,
      transaction: tx,
      purchase: tx,
      movement: {
        id: tx.id,
        type: "EARN",
        points: pointsEarned,
        balance_after: updated.available_points,
        reason: `Achat de ${amount.toFixed(2)} €`,
        created_at: tx.created_at,
      },
      customer: updatedDetail!,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Impossible d'enregistrer la transaction." };
  }
}

export type RedeemPointsResult =
  | {
      success: true;
      transaction: Transaction;
      movement?: MovementRecord;
      customer: CustomerDetail;
    }
  | { success: false; error: string; availablePoints?: number };

/**
 * Deducts loyalty points for a customer during a purchase (amount can be >= 0).
 * Enforces the domain rule: zero points earned when redeeming (consuming benefits).
 */
export async function redeemPoints(
  customerId: string,
  pointsToRedeem: number,
  cashierId: string | null,
  amount: number = 0,
  reason?: string,
  customerRepo: ICustomerRepository = defaultCustomerRepo,
  txRepo: ITransactionRepository = defaultTransactionRepo
): Promise<RedeemPointsResult> {
  const detailBefore = await customerRepo.getById(customerId);
  if (!detailBefore) {
    return { success: false, error: "Client introuvable." };
  }

  if (!canRedeemPoints(detailBefore.available_points, pointsToRedeem)) {
    return {
      success: false,
      error: `Solde insuffisant : ${detailBefore.available_points} point(s) disponible(s).`,
      availablePoints: detailBefore.available_points,
    };
  }

  const purchaseAmount = Math.max(0, isNaN(amount) ? 0 : Number(amount));
  const pointsEarned = calculateRedemptionPointsEarned(purchaseAmount);

  try {
    const tx = await txRepo.create({
      customerId,
      cashierId,
      amount: purchaseAmount,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
    });

    const updated = applyRedeemPoints(
      detailBefore.available_points,
      detailBefore.historical_points,
      pointsToRedeem
    );

    await customerRepo.updateLoyaltyPoints(customerId, updated.available_points);
    const updatedDetail = await customerRepo.getById(customerId);

    const movementReason =
      reason && reason.trim()
        ? reason.trim()
        : purchaseAmount > 0
          ? `Remise fidélité (Achat de ${purchaseAmount.toFixed(2)} €)`
          : LOYALTY_CONFIG.defaults.redeemReason;

    return {
      success: true,
      transaction: tx,
      movement: {
        id: tx.id,
        type: "REDEEM",
        points: -pointsToRedeem,
        balance_after: updated.available_points,
        reason: movementReason,
        created_at: tx.created_at,
      },
      customer: updatedDetail!,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Impossible d'enregistrer la déduction des points." };
  }
}
