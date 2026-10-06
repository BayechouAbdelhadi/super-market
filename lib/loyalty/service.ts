import { CustomerDetail, CustomerSummary, LoyaltyTier, Transaction } from "./types";
import { supabase } from "@/lib/supabase/client";

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

export function calculatePoints(amount: number): number {
  if (amount <= 0 || isNaN(amount)) return 0;
  return Math.floor(amount);
}

export function calculateTier(historicalPoints: number): LoyaltyTier {
  if (historicalPoints >= 5000) return "VIP";
  if (historicalPoints >= 2000) return "GOLD";
  if (historicalPoints >= 500) return "SILVER";
  return "BRONZE";
}

export async function searchCustomers(query: string): Promise<CustomerSummary[]> {
  const trimmed = query.trim().toLowerCase();
  
  let dbQuery = supabase
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
  
  if (error || !data) return [];

  // We need to calculate historical points. 
  // In a real app, you'd calculate this in SQL or a materialized view.
  // For this implementation, we fetch the available_points from customers table
  // and we'd need to fetch transactions to get historical points.
  // To keep it simple per search, we will just set historical to available for the summary,
  // or fetch aggregations via RPC. Here we estimate for now.
  return data.map((p: any) => {
    const available_points = p.customers?.[0]?.loyalty_points || 0;
    return {
      id: p.id,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      full_name: `${p.first_name} ${p.last_name}`.trim(),
      email: p.email || "",
      phone: p.phone_number || "",
      phone_normalized: p.phone_number || "",
      tier: (p.customers?.[0]?.status as LoyaltyTier) || "BRONZE",
      historical_points: available_points, // Approximation for summary list
      available_points,
    };
  });
}

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id, first_name, last_name, email, phone_number, created_at,
      customers ( loyalty_points, status, updated_at )
    `)
    .eq("id", customerId)
    .single();

  if (!profile) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  let historicalPoints = 0;
  transactions?.forEach(t => {
    historicalPoints += t.points_earned;
  });

  const available_points = profile.customers?.[0]?.loyalty_points || 0;
  const tier = calculateTier(historicalPoints);

  return {
    id: profile.id,
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    full_name: `${profile.first_name} ${profile.last_name}`.trim(),
    email: profile.email || "",
    phone: profile.phone_number || "",
    phone_normalized: profile.phone_number || "",
    tier,
    historical_points: historicalPoints,
    available_points,
    created_at: profile.created_at,
    updated_at: profile.customers?.[0]?.updated_at || profile.created_at,
    transactions: transactions || [],
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
  | { success: false; error: string; };

export async function createCustomer(data: CreateCustomerInput): Promise<CreateCustomerResult> {
  const phoneNormalized = normalizePhone(data.phone);

  // Use signUp to create the auth user, which triggers profile creation
  const password = Math.random().toString(36).slice(-8) + "A1!";
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        role: 'CUSTOMER'
      }
    }
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || "Erreur de création." };
  }

  // Update profile with phone number
  await supabase
    .from("profiles")
    .update({ phone_number: phoneNormalized })
    .eq("id", authData.user.id);

  const detail = await getCustomerDetail(authData.user.id);
  return { success: true, customer: detail! };
}

export type RecordPurchaseResult =
  | { success: true; transaction: Transaction; customer: CustomerDetail }
  | { success: false; error: string; };

export async function recordPurchase(customerId: string, amount: number, cashierId: string): Promise<RecordPurchaseResult> {
  const pointsEarned = calculatePoints(amount);
  
  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      customer_id: customerId,
      cashier_id: cashierId,
      amount_total: amount,
      points_earned: pointsEarned,
      points_redeemed: 0
    })
    .select()
    .single();

  if (error || !tx) {
    return { success: false, error: "Impossible d'enregistrer la transaction." };
  }

  // Update customer points
  const detailBefore = await getCustomerDetail(customerId);
  const newPoints = (detailBefore?.available_points || 0) + pointsEarned;
  
  await supabase
    .from("customers")
    .update({ loyalty_points: newPoints })
    .eq("id", customerId);

  const updatedDetail = await getCustomerDetail(customerId);
  return { success: true, transaction: tx, customer: updatedDetail! };
}

export type RedeemPointsResult =
  | { success: true; transaction: Transaction; customer: CustomerDetail }
  | { success: false; error: string; availablePoints?: number };

export async function redeemPoints(customerId: string, pointsToRedeem: number, cashierId: string): Promise<RedeemPointsResult> {
  const detailBefore = await getCustomerDetail(customerId);
  if (!detailBefore) return { success: false, error: "Client introuvable" };

  if (pointsToRedeem > detailBefore.available_points) {
    return { 
      success: false, 
      error: "Solde insuffisant", 
      availablePoints: detailBefore.available_points 
    };
  }

  const { data: tx, error } = await supabase
    .from("transactions")
    .insert({
      customer_id: customerId,
      cashier_id: cashierId,
      amount_total: 0,
      points_earned: 0,
      points_redeemed: pointsToRedeem
    })
    .select()
    .single();

  if (error || !tx) {
    return { success: false, error: "Impossible d'enregistrer la transaction." };
  }

  // Update customer points
  const newPoints = detailBefore.available_points - pointsToRedeem;
  await supabase
    .from("customers")
    .update({ loyalty_points: newPoints })
    .eq("id", customerId);

  const updatedDetail = await getCustomerDetail(customerId);
  return { success: true, transaction: tx, customer: updatedDetail! };
}
