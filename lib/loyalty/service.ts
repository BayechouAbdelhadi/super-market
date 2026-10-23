import {
  CustomerDetail,
  CustomerSummary,
  Transaction,
  MovementRecord,
  CreateCustomerInput,
  PurchaseRecord,
  UserRole,
} from "./types";
import { ICustomerRepository, ITransactionRepository, Page } from "./ports";
import { SupabaseCustomerRepository } from "./adapters/supabase-customer-repository";
import { SupabaseTransactionRepository } from "./adapters/supabase-transaction-repository";
import { getAppSettings } from "@/lib/settings/service";
import {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  validateRedemption,
  applyPurchasePoints,
  applyRedeemPoints,
  calculateRedemptionPointsEarned,
  toPurchaseRecord,
  canEditTransaction,
  applyTransactionEdit,
} from "./domain";

export {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  validateRedemption,
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
 * Searches customers with database-side pagination via the Customer Port.
 */
export async function searchCustomersPage(
  query: string,
  limit: number,
  offset: number,
  customerRepo: ICustomerRepository = defaultCustomerRepo
): Promise<Page<CustomerSummary>> {
  return await customerRepo.searchPage(query, limit, offset);
}

/**
 * Lists a customer's purchase history with database-side pagination (newest first).
 */
export async function getCustomerPurchasesPage(
  customerId: string,
  limit: number,
  offset: number,
  transactionRepo: ITransactionRepository = defaultTransactionRepo
): Promise<Page<PurchaseRecord>> {
  const { items, total } = await transactionRepo.getPageByCustomerId(customerId, limit, offset);
  return { items: items.map(toPurchaseRecord), total };
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
  } catch (err) {
    return { success: false, error: (err instanceof Error && err.message) || "Erreur de création du compte client." };
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

  const settings = await getAppSettings();
  const pointsEarned = calculatePoints(amount, settings.loyalty.euroToPointsRatio);

  try {
    const tx = await txRepo.create({
      customerId,
      cashierId,
      amount,
      pointsEarned,
      pointsRedeemed: 0,
    });

    const tierThresholds = {
      silver: settings.loyalty.tierSilverMinPoints,
      gold: settings.loyalty.tierGoldMinPoints,
      vip: settings.loyalty.tierVipMinPoints,
    };

    const updated = applyPurchasePoints(
      detailBefore.available_points,
      detailBefore.historical_points,
      pointsEarned,
      tierThresholds
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
        reason: `Achat de ${amount.toFixed(2)} € (+${pointsEarned} pts)`,
        created_at: tx.created_at,
      },
      customer: updatedDetail!,
    };
  } catch (err) {
    return { success: false, error: (err instanceof Error && err.message) || "Impossible d'enregistrer la transaction." };
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

  const settings = await getAppSettings();
  const purchaseAmount = Math.max(0, isNaN(amount) ? 0 : Number(amount));

  const validation = validateRedemption(
    pointsToRedeem,
    detailBefore.available_points,
    {
      minPointsToRedeem: settings.loyalty.minPointsToRedeem,
      maxDiscountPerTransactionEuro: settings.loyalty.maxDiscountPerTransactionEuro,
      pointValueInEuro: settings.loyalty.pointValueInEuro,
      purchaseAmount,
    },
    purchaseAmount
  );

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || "Opération de déduction invalide.",
      availablePoints: detailBefore.available_points,
    };
  }

  const pointsEarned = calculateRedemptionPointsEarned(purchaseAmount);

  try {
    const tx = await txRepo.create({
      customerId,
      cashierId,
      amount: purchaseAmount,
      pointsEarned,
      pointsRedeemed: pointsToRedeem,
    });

    const tierThresholds = {
      silver: settings.loyalty.tierSilverMinPoints,
      gold: settings.loyalty.tierGoldMinPoints,
      vip: settings.loyalty.tierVipMinPoints,
    };

    const updated = applyRedeemPoints(
      detailBefore.available_points,
      detailBefore.historical_points,
      pointsToRedeem,
      tierThresholds,
      {
        minPointsToRedeem: settings.loyalty.minPointsToRedeem,
        maxDiscountPerTransactionEuro: settings.loyalty.maxDiscountPerTransactionEuro,
        pointValueInEuro: settings.loyalty.pointValueInEuro,
        purchaseAmount,
      },
      purchaseAmount
    );

    await customerRepo.updateLoyaltyPoints(customerId, updated.available_points);
    const updatedDetail = await customerRepo.getById(customerId);

    const discountEuro = (pointsToRedeem * settings.loyalty.pointValueInEuro).toFixed(2);
    const movementReason =
      reason && reason.trim()
        ? `${reason.trim()} (-${discountEuro} €)`
        : purchaseAmount > 0
          ? `Remise fidélité -${discountEuro} € (Achat de ${purchaseAmount.toFixed(2)} €)`
          : `${settings.pos.defaultRedeemReason} (-${discountEuro} €)`;

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
  } catch (err) {
    return { success: false, error: (err instanceof Error && err.message) || "Impossible d'enregistrer la déduction des points." };
  }
}

/**
 * Loads a transaction for the edit screen.
 */
export async function getTransaction(
  transactionId: string,
  txRepo: ITransactionRepository = defaultTransactionRepo
): Promise<Transaction | null> {
  return await txRepo.getById(transactionId);
}

export type EditTransactionResult =
  | { success: true; transaction: Transaction; customer: CustomerDetail }
  | { success: false; error: string; code: "NOT_FOUND" | "FORBIDDEN" | "INVALID" | "ERROR" };

/**
 * Corrects a recorded transaction (wrong amount or points) and moves the customer's
 * balance by the difference. Admins can edit any transaction, cashiers only today's.
 */
export async function editTransaction(
  transactionId: string,
  input: { amount: number; pointsRedeemed?: number },
  caller: { id: string; role: UserRole },
  customerRepo: ICustomerRepository = defaultCustomerRepo,
  txRepo: ITransactionRepository = defaultTransactionRepo
): Promise<EditTransactionResult> {
  const before = await txRepo.getById(transactionId);
  if (!before) {
    return { success: false, code: "NOT_FOUND", error: "Transaction introuvable." };
  }

  if (!canEditTransaction(caller.role, before.created_at)) {
    return {
      success: false,
      code: "FORBIDDEN",
      error: "Seules les transactions du jour peuvent être modifiées par un caissier.",
    };
  }

  const oldRedeemed = Number(before.points_redeemed) || 0;
  if (oldRedeemed === 0 && input.amount <= 0) {
    return { success: false, code: "INVALID", error: "Le montant de l'achat doit être strictement supérieur à 0 €." };
  }

  const customer = await customerRepo.getById(before.customer_id);
  if (!customer) {
    return { success: false, code: "NOT_FOUND", error: "Client introuvable." };
  }

  const settings = await getAppSettings();
  const edit = applyTransactionEdit(
    {
      amount: Number(before.amount_total) || 0,
      pointsEarned: Number(before.points_earned) || 0,
      pointsRedeemed: oldRedeemed,
    },
    input,
    { availablePoints: customer.available_points, historicalPoints: customer.historical_points },
    settings.loyalty.euroToPointsRatio,
    {
      silver: settings.loyalty.tierSilverMinPoints,
      gold: settings.loyalty.tierGoldMinPoints,
      vip: settings.loyalty.tierVipMinPoints,
    },
    {
      minPointsToRedeem: settings.loyalty.minPointsToRedeem,
      maxDiscountPerTransactionEuro: settings.loyalty.maxDiscountPerTransactionEuro,
      pointValueInEuro: settings.loyalty.pointValueInEuro,
    }
  );

  if (!edit.valid) {
    return { success: false, code: "INVALID", error: edit.error };
  }

  try {
    const tx = await txRepo.update(transactionId, {
      amount: input.amount,
      pointsEarned: edit.pointsEarned,
      pointsRedeemed: edit.pointsRedeemed,
      editedBy: caller.id,
    });
    await customerRepo.updateLoyaltyPoints(before.customer_id, edit.available_points, edit.tier);
    const updatedDetail = await customerRepo.getById(before.customer_id);
    return { success: true, transaction: tx, customer: updatedDetail! };
  } catch (err) {
    return {
      success: false,
      code: "ERROR",
      error: (err instanceof Error && err.message) || "Impossible de modifier la transaction.",
    };
  }
}
