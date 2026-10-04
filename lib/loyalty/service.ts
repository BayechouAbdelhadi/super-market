import { Customer, CustomerDetail, CustomerSummary, LoyaltyTier, PointMovement, Purchase } from "./types";
import { loyaltyStore } from "./store";

/**
 * Normalise un numéro de téléphone en extrayant uniquement les chiffres
 * et en gérant le préfixe international français (+33 / 33 -> 0).
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

/**
 * Règle de fidélité : 1 € dépensé = 1 point (arrondi inférieur).
 * Montant avec centimes conservé dans l'achat, points entiers.
 */
export function calculatePoints(amount: number): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  return Math.floor(amount);
}

/**
 * Calcule le statut en fonction des points historiques (cumul total gagné).
 * - Bronze : 0 – 499
 * - Silver : 500 – 1 999
 * - Gold   : 2 000 – 4 999
 * - VIP    : 5 000+
 */
export function calculateTier(historicalPoints: number): LoyaltyTier {
  if (historicalPoints >= 5000) return "VIP";
  if (historicalPoints >= 2000) return "Gold";
  if (historicalPoints >= 500) return "Silver";
  return "Bronze";
}

/**
 * Calcule les soldes de points et le statut d'un client.
 */
export function computeCustomerBalances(customerId: string): {
  historical_points: number;
  available_points: number;
  tier: LoyaltyTier;
} {
  const movements = loyaltyStore.getMovementsByCustomer(customerId);

  let historicalPoints = 0;
  let redeemedPoints = 0;
  let adjustments = 0;

  for (const m of movements) {
    if (m.type === "EARN") {
      historicalPoints += m.amount;
    } else if (m.type === "REDEEM") {
      redeemedPoints += m.amount;
    } else if (m.type === "ADJUSTMENT") {
      adjustments += m.amount;
    }
  }

  const availablePoints = Math.max(0, historicalPoints - redeemedPoints + adjustments);
  const tier = calculateTier(historicalPoints);

  return {
    historical_points: historicalPoints,
    available_points: availablePoints,
    tier,
  };
}

/**
 * Retourne le résumé enrichi d'un client.
 */
export function getCustomerSummary(customer: Customer): CustomerSummary {
  const balances = computeCustomerBalances(customer.id);
  return {
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    full_name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone,
    phone_normalized: customer.phone_normalized,
    tier: balances.tier,
    historical_points: balances.historical_points,
    available_points: balances.available_points,
  };
}

/**
 * Recherche flexible à champ unique sur :
 * - Prénom
 * - Nom
 * - Nom + Prénom (ex: "Bayechou Ahmed")
 * - Prénom + Nom (ex: "Ahmed Bayechou")
 * - Téléphone (normalisé)
 * - Email
 * Insensible à la casse et tolérant aux espaces inutiles.
 */
export function searchCustomers(query: string): CustomerSummary[] {
  const trimmed = query.trim().toLowerCase();
  const allCustomers = loyaltyStore.getCustomers();

  if (!trimmed) {
    return allCustomers.map(getCustomerSummary);
  }

  const phoneQuery = normalizePhone(trimmed);

  const matched = allCustomers.filter((c) => {
    const fn = c.first_name.toLowerCase();
    const ln = c.last_name.toLowerCase();
    const email = c.email.toLowerCase();
    const fullName1 = `${fn} ${ln}`;
    const fullName2 = `${ln} ${fn}`;

    // Correspondance prénom ou nom
    if (fn.includes(trimmed) || ln.includes(trimmed)) return true;

    // Correspondance nom complet dans les deux ordres
    if (fullName1.includes(trimmed) || fullName2.includes(trimmed)) return true;

    // Correspondance email
    if (email.includes(trimmed)) return true;

    // Correspondance téléphone normalisé
    if (phoneQuery && c.phone_normalized.includes(phoneQuery)) return true;

    return false;
  });

  return matched.map(getCustomerSummary);
}

/**
 * Récupère le détail complet d'un client (fiche, achats, mouvements).
 */
export function getCustomerDetail(customerId: string): CustomerDetail | null {
  const customer = loyaltyStore.findCustomerById(customerId);
  if (!customer) return null;

  const summary = getCustomerSummary(customer);
  const purchases = loyaltyStore.getPurchasesByCustomer(customerId);
  const movements = loyaltyStore.getMovementsByCustomer(customerId);

  return {
    ...summary,
    created_at: customer.created_at,
    updated_at: customer.updated_at,
    purchases,
    movements,
  };
}

export interface CreateCustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export type CreateCustomerResult =
  | { success: true; customer: CustomerDetail }
  | {
      success: false;
      isDuplicate: true;
      field: "phone" | "email";
      message: string;
      existingCustomer: CustomerSummary;
    }
  | {
      success: false;
      isDuplicate: false;
      error: string;
    };

/**
 * Création d'un client avec vérification anti-doublon (email et téléphone).
 */
export function createCustomer(data: CreateCustomerInput, cashierId: string): CreateCustomerResult {
  const firstName = data.first_name?.trim();
  const lastName = data.last_name?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim();

  if (!firstName || !lastName || !email || !phone) {
    return {
      success: false,
      isDuplicate: false,
      error: "Tous les champs sont obligatoires : prénom, nom, email et téléphone.",
    };
  }

  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized || phoneNormalized.length < 8) {
    return {
      success: false,
      isDuplicate: false,
      error: "Numéro de téléphone invalide.",
    };
  }

  // Vérification doublon téléphone
  const existingByPhone = loyaltyStore.findCustomerByPhoneNormalized(phoneNormalized);
  if (existingByPhone) {
    return {
      success: false,
      isDuplicate: true,
      field: "phone",
      message: `Un client utilisant ce numéro de téléphone existe déjà.`,
      existingCustomer: getCustomerSummary(existingByPhone),
    };
  }

  // Vérification doublon email
  const existingByEmail = loyaltyStore.findCustomerByEmail(email);
  if (existingByEmail) {
    return {
      success: false,
      isDuplicate: true,
      field: "email",
      message: `Un client utilisant cette adresse email existe déjà.`,
      existingCustomer: getCustomerSummary(existingByEmail),
    };
  }

  const now = new Date().toISOString();
  const newCustomer: Customer = {
    id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    phone_normalized: phoneNormalized,
    created_at: now,
    updated_at: now,
    created_by: cashierId,
  };

  loyaltyStore.addCustomer(newCustomer);

  const detail = getCustomerDetail(newCustomer.id)!;
  return {
    success: true,
    customer: detail,
  };
}

export type RecordPurchaseResult =
  | {
      success: true;
      purchase: Purchase;
      movement: PointMovement;
      customer: CustomerDetail;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Enregistre un achat pour un client, attribue automatiquement les points (1 € = 1 pt)
 * et historise le mouvement.
 */
export function recordPurchase(customerId: string, amount: number, cashierId: string): RecordPurchaseResult {
  const customer = loyaltyStore.findCustomerById(customerId);
  if (!customer) {
    return { success: false, error: "Client introuvable." };
  }

  if (typeof amount !== "number" || amount <= 0 || isNaN(amount)) {
    return { success: false, error: "Le montant de l'achat doit être un nombre positif supérieur à zéro." };
  }

  const pointsEarned = calculatePoints(amount);
  const now = new Date().toISOString();

  const purchase: Purchase = {
    id: `purch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customer_id: customerId,
    amount: Number(amount.toFixed(2)),
    points_earned: pointsEarned,
    transaction_date: now,
    created_at: now,
    created_by: cashierId,
  };

  loyaltyStore.addPurchase(purchase);

  const movement: PointMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customer_id: customerId,
    type: "EARN",
    amount: pointsEarned,
    purchase_id: purchase.id,
    reason: `Achat magasin (${purchase.amount.toFixed(2)} €)`,
    created_at: now,
    created_by: cashierId,
  };

  loyaltyStore.addMovement(movement);

  const updatedDetail = getCustomerDetail(customerId)!;

  return {
    success: true,
    purchase,
    movement,
    customer: updatedDetail,
  };
}

export type RedeemPointsResult =
  | {
      success: true;
      movement: PointMovement;
      customer: CustomerDetail;
    }
  | {
      success: false;
      error: string;
      availablePoints?: number;
    };

/**
 * Déduit des points pour un client si le solde disponible est suffisant.
 * Le statut reste intact car il est basé sur les points historiques.
 */
export function redeemPoints(
  customerId: string,
  pointsToRedeem: number,
  cashierId: string,
  reason?: string,
): RedeemPointsResult {
  const customer = loyaltyStore.findCustomerById(customerId);
  if (!customer) {
    return { success: false, error: "Client introuvable." };
  }

  if (!Number.isInteger(pointsToRedeem) || pointsToRedeem <= 0) {
    return { success: false, error: "Le nombre de points à déduire doit être un entier strictement positif." };
  }

  const balances = computeCustomerBalances(customerId);

  if (pointsToRedeem > balances.available_points) {
    return {
      success: false,
      error: `Opération refusée : solde disponible insuffisant (${balances.available_points} disponibles, ${pointsToRedeem} demandés).`,
      availablePoints: balances.available_points,
    };
  }

  const now = new Date().toISOString();

  const movement: PointMovement = {
    id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    customer_id: customerId,
    type: "REDEEM",
    amount: pointsToRedeem,
    purchase_id: null,
    reason: reason || "Déduction points fidélité en caisse",
    created_at: now,
    created_by: cashierId,
  };

  loyaltyStore.addMovement(movement);

  const updatedDetail = getCustomerDetail(customerId)!;

  return {
    success: true,
    movement,
    customer: updatedDetail,
  };
}
