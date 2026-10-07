import { CustomerDetail, CustomerSummary, LoyaltyTier, Transaction } from "./types";
import { createIsolatedClient } from "@/lib/supabase/isolated";

async function getSupabase() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    return await createClient();
  } catch {
    const { supabase } = await import("@/lib/supabase/client");
    return supabase;
  }
}

import {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
} from "./domain";

export {
  normalizePhone,
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
};


export async function searchCustomers(query: string): Promise<CustomerSummary[]> {
  const sb = await getSupabase();
  const trimmed = query.trim().toLowerCase();
  
  let dbQuery = sb
    .from("profiles")
    .select(`
      id, first_name, last_name, email, phone_number,
      customers ( loyalty_points, status )
    `)
    .eq("role", "CUSTOMER");

  if (trimmed) {
    dbQuery = dbQuery.or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone_number.ilike.%${trimmed}%`);
  }

  const { data, error } = await dbQuery.limit(50);
  
  if (error || !data) {
    console.error("Erreur searchCustomers Supabase:", error);
    return [];
  }

  return data.map((p: any) => {
    const cust = Array.isArray(p.customers) ? p.customers[0] : p.customers;
    const available_points = cust?.loyalty_points ?? 0;
    const tier = (cust?.status as LoyaltyTier) || calculateTier(available_points) || "BRONZE";
    const firstName = p.first_name || "";
    const lastName = p.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || p.email || "Client";

    return {
      id: p.id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: p.email || "",
      phone: p.phone_number || "",
      phone_normalized: p.phone_number || "",
      tier,
      historical_points: available_points,
      available_points,
    };
  });
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const sb = await getSupabase();
  const { data: profile, error: profileErr } = await sb
    .from("profiles")
    .select(`
      id, first_name, last_name, email, phone_number, created_at,
      customers ( loyalty_points, status, updated_at )
    `)
    .eq("id", customerId)
    .single();

  if (profileErr || !profile) {
    console.error("Erreur getCustomerDetail Supabase:", profileErr);
    return null;
  }

  const { data: transactions } = await sb
    .from("transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  let historicalPoints = 0;
  transactions?.forEach((t: any) => {
    historicalPoints += (t.points_earned || 0);
  });

  const cust = Array.isArray(profile.customers) ? profile.customers[0] : profile.customers;
  const available_points = cust?.loyalty_points ?? 0;
  historicalPoints = Math.max(historicalPoints, available_points);
  const tier = (cust?.status as LoyaltyTier) || calculateTier(historicalPoints);

  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim() || profile.email || "Client";

  return {
    id: profile.id,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    email: profile.email || "",
    phone: profile.phone_number || "",
    phone_normalized: profile.phone_number || "",
    tier,
    historical_points: historicalPoints,
    available_points,
    created_at: profile.created_at,
    updated_at: cust?.updated_at || profile.created_at,
    transactions: transactions || [],
    purchases: (transactions || [])
      .filter((t: any) => Number(t.amount_total) > 0)
      .map((t: any) => ({
        id: t.id,
        amount: Number(t.amount_total),
        points_earned: t.points_earned,
        transaction_date: t.created_at,
        created_by: t.cashier_id ? `Caissier (${t.cashier_id.slice(0, 6)})` : "Caisse #1",
      })),
    movements: (transactions || []).map((t: any) => {
      const isEarn = t.points_earned > 0;
      return {
        id: t.id,
        type: isEarn ? "EARN" : "REDEEM",
        amount: isEarn ? t.points_earned : t.points_redeemed,
        reason: isEarn ? `Achat de ${Number(t.amount_total).toFixed(2)} €` : "Remise fidélité en caisse",
        created_at: t.created_at,
        created_by: t.cashier_id ? `Caissier (${t.cashier_id.slice(0, 6)})` : "Caisse #1",
      };
    }),
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
      isDuplicate?: boolean; 
      field?: "email" | "phone"; 
      message?: string; 
      existingCustomer?: CustomerSummary; 
      error: string; 
    };

export async function createCustomer(data: CreateCustomerInput): Promise<CreateCustomerResult> {
  const sb = await getSupabase();
  const phoneNormalized = normalizePhone(data.phone);
  const emailNormalized = data.email.toLowerCase().trim();
  const firstName = data.first_name.trim();
  const lastName = data.last_name.trim();

  // 1. Vérification doublon email dans profiles
  const { data: existingEmail } = await sb
    .from("profiles")
    .select("id")
    .eq("email", emailNormalized)
    .limit(1);

  if (existingEmail && existingEmail.length > 0) {
    const existing = await getCustomerDetail(existingEmail[0].id);
    return {
      success: false,
      isDuplicate: true,
      field: "email",
      message: "Un client avec cette adresse email existe déjà.",
      existingCustomer: existing || undefined,
      error: "Un client avec cette adresse email existe déjà.",
    };
  }

  // 2. Vérification doublon téléphone dans profiles
  const { data: existingPhone } = await sb
    .from("profiles")
    .select("id")
    .eq("phone_number", phoneNormalized)
    .limit(1);

  if (existingPhone && existingPhone.length > 0) {
    const existing = await getCustomerDetail(existingPhone[0].id);
    return {
      success: false,
      isDuplicate: true,
      field: "phone",
      message: "Un client avec ce numéro de téléphone existe déjà.",
      existingCustomer: existing || undefined,
      error: "Un client avec ce numéro de téléphone existe déjà.",
    };
  }

  // 3. Création du compte utilisateur dans Supabase auth SANS modifier les cookies du caissier
  const isolatedClient = createIsolatedClient();
  const password = Math.random().toString(36).slice(-8) + "A1!";
  const { data: authData, error: authError } = await isolatedClient.auth.signUp({
    email: emailNormalized,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNormalized,
        role: 'CUSTOMER'
      }
    }
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Erreur de création du compte client." };
  }

  // 4. Insertion/mise à jour du profil et de la fiche fidélité
  await sb
    .from("profiles")
    .upsert({
      id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email: emailNormalized,
      phone_number: phoneNormalized,
      role: 'CUSTOMER'
    });

  await sb
    .from("customers")
    .upsert({
      id: authData.user.id,
      loyalty_points: 0,
      status: 'BRONZE'
    });

  const detail = await getCustomerDetail(authData.user.id);
  return { success: true, customer: detail! };
}

export type RecordPurchaseResult =
  | { 
      success: true; 
      transaction: Transaction; 
      purchase: Transaction; 
      movement?: any;
      customer: CustomerDetail 
    }
  | { success: false; error: string; };

export async function recordPurchase(customerId: string, amount: number, cashierId: string | null): Promise<RecordPurchaseResult> {
  const sb = await getSupabase();
  const pointsEarned = calculatePoints(amount);

  let activeCashierId = cashierId;
  if (!activeCashierId) {
    const { data: { user } } = await sb.auth.getUser();
    activeCashierId = user?.id || null;
  }

  const { data: tx, error } = await sb
    .from("transactions")
    .insert({
      customer_id: customerId,
      cashier_id: activeCashierId,
      amount_total: amount,
      points_earned: pointsEarned,
      points_redeemed: 0
    })
    .select()
    .single();

  if (error || !tx) {
    console.error("Erreur insert transaction Supabase:", error);
    return { success: false, error: error?.message || "Impossible d'enregistrer la transaction." };
  }

  // Mise à jour des points et du palier
  const detailBefore = await getCustomerDetail(customerId);
  const newAvailablePoints = (detailBefore?.available_points || 0) + pointsEarned;
  const newHistoricalPoints = (detailBefore?.historical_points || 0) + pointsEarned;
  const newTier = calculateTier(newHistoricalPoints);
  
  await sb
    .from("customers")
    .upsert({
      id: customerId,
      loyalty_points: newAvailablePoints,
      status: newTier,
      updated_at: new Date().toISOString()
    });

  const updatedDetail = await getCustomerDetail(customerId);
  return { 
    success: true, 
    transaction: tx, 
    purchase: tx, 
    movement: {
      id: tx.id,
      type: "EARN",
      points: pointsEarned,
      balance_after: newAvailablePoints,
      reason: `Achat de ${amount.toFixed(2)} €`,
      created_at: tx.created_at
    },
    customer: updatedDetail! 
  };
}

export type RedeemPointsResult =
  | { 
      success: true; 
      transaction: Transaction; 
      movement?: any;
      customer: CustomerDetail 
    }
  | { success: false; error: string; availablePoints?: number };

export async function redeemPoints(customerId: string, pointsToRedeem: number, cashierId: string | null): Promise<RedeemPointsResult> {
  const sb = await getSupabase();
  const detailBefore = await getCustomerDetail(customerId);
  if (!detailBefore) return { success: false, error: "Client introuvable." };

  if (pointsToRedeem > detailBefore.available_points) {
    return { 
      success: false, 
      error: `Solde insuffisant : ${detailBefore.available_points} point(s) disponible(s).`, 
      availablePoints: detailBefore.available_points 
    };
  }

  let activeCashierId = cashierId;
  if (!activeCashierId) {
    const { data: { user } } = await sb.auth.getUser();
    activeCashierId = user?.id || null;
  }

  const { data: tx, error } = await sb
    .from("transactions")
    .insert({
      customer_id: customerId,
      cashier_id: activeCashierId,
      amount_total: 0,
      points_earned: 0,
      points_redeemed: pointsToRedeem
    })
    .select()
    .single();

  if (error || !tx) {
    console.error("Erreur insert transaction redeem Supabase:", error);
    return { success: false, error: error?.message || "Impossible d'enregistrer la déduction des points." };
  }

  // Déduction des points
  const newAvailablePoints = detailBefore.available_points - pointsToRedeem;
  await sb
    .from("customers")
    .upsert({
      id: customerId,
      loyalty_points: newAvailablePoints,
      updated_at: new Date().toISOString()
    });

  const updatedDetail = await getCustomerDetail(customerId);
  return { 
    success: true, 
    transaction: tx, 
    movement: {
      id: tx.id,
      type: "REDEEM",
      points: -pointsToRedeem,
      balance_after: newAvailablePoints,
      reason: "Remise fidélité en caisse",
      created_at: tx.created_at
    },
    customer: updatedDetail! 
  };
}
