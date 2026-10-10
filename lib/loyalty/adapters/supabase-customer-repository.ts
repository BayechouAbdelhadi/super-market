import crypto from "crypto";
import { ICustomerRepository } from "../ports";
import {
  CustomerDetail,
  CustomerSummary,
  LoyaltyTier,
  CreateCustomerInput,
  ProfileWithCustomerRow,
  Transaction,
} from "../types";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, calculateTier } from "../domain";
import { LOYALTY_CONFIG } from "../config";

/**
 * Infrastructure Adapter implementing ICustomerRepository via Supabase.
 * Encapsulates all SQL/Supabase interactions for customers (Hexagonal Architecture).
 */
export class SupabaseCustomerRepository implements ICustomerRepository {
  private async getClient() {
    return await createServerClient();
  }

  async search(query: string, limit: number = LOYALTY_CONFIG.pagination.defaultPageSize): Promise<CustomerSummary[]> {
    const sb = await this.getClient();
    const trimmed = query.trim().toLowerCase();

    let dbQuery = sb
      .from("profiles")
      .select(`
        id, first_name, last_name, email, phone_number,
        customers ( loyalty_points, status )
      `)
      .eq("role", "CUSTOMER");

    if (trimmed) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone_number.ilike.%${trimmed}%`
      );
    }

    const { data, error } = await dbQuery.limit(limit);

    if (error || !data) {
      console.error("[SupabaseCustomerRepository] search error:", error);
      return [];
    }

    return (data as ProfileWithCustomerRow[]).map((p) => {
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

  async getById(id: string, transactionsLimit: number = LOYALTY_CONFIG.pagination.maxPageSize): Promise<CustomerDetail | null> {
    const sb = await this.getClient();

    const { data: profile, error: profileErr } = await sb
      .from("profiles")
      .select(`
        id, first_name, last_name, email, phone_number, created_at,
        customers ( loyalty_points, status, updated_at )
      `)
      .eq("id", id)
      .single();

    if (profileErr || !profile) {
      console.error("[SupabaseCustomerRepository] getById error:", profileErr);
      return null;
    }

    const { data: rawTransactions } = await sb
      .from("transactions")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(transactionsLimit);

    const transactions = (rawTransactions || []) as Transaction[];

    let historicalPoints = 0;
    transactions.forEach((t) => {
      historicalPoints += t.points_earned || 0;
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
      transactions,
      purchases: transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount_total) || 0,
        points_earned: Number(t.points_earned) || 0,
        points_redeemed: Number(t.points_redeemed) || 0,
        transaction_date: t.created_at,
        created_by: t.cashier_id ? `Caissier (${t.cashier_id.slice(0, 6)})` : LOYALTY_CONFIG.defaults.cashierName,
      })),
      movements: transactions.map((t) => {
        const isEarn = (t.points_earned || 0) > 0;
        const isRedeem = (t.points_redeemed || 0) > 0;
        const amountTotal = Number(t.amount_total) || 0;
        const defaultRedeemReason = amountTotal > 0
          ? `Remise fidélité (Achat de ${amountTotal.toFixed(2)} €)`
          : LOYALTY_CONFIG.defaults.redeemReason;
        return {
          id: t.id,
          type: isEarn ? "EARN" : "REDEEM",
          amount: isEarn ? t.points_earned : t.points_redeemed,
          reason: isEarn ? `Achat de ${amountTotal.toFixed(2)} €` : defaultRedeemReason,
          created_at: t.created_at,
          created_by: t.cashier_id ? `Caissier (${t.cashier_id.slice(0, 6)})` : LOYALTY_CONFIG.defaults.cashierName,
        };
      }),
    };
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    const sb = await this.getClient();
    const { data } = await sb
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .limit(1);

    return data && data.length > 0 ? { id: data[0].id } : null;
  }

  async findByPhone(phone: string): Promise<{ id: string } | null> {
    const sb = await this.getClient();
    const { data } = await sb
      .from("profiles")
      .select("id")
      .eq("phone_number", normalizePhone(phone))
      .limit(1);

    return data && data.length > 0 ? { id: data[0].id } : null;
  }

  async createAuthAndProfile(data: CreateCustomerInput): Promise<{ id: string; email: string }> {
    const phoneNormalized = normalizePhone(data.phone);
    const emailNormalized = data.email.toLowerCase().trim();
    const firstName = data.first_name.trim();
    const lastName = data.last_name.trim();

    const adminClient = createAdminClient();
    const securePassword = crypto.randomBytes(16).toString("hex") + "A1!";

    // Create user in Supabase Auth (Brevo confirmation email will prompt them to set their password)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: emailNormalized,
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNormalized,
        role: "CUSTOMER",
      },
    });

    if (authError || !authData.user) {
      console.error("[CustomerRepository] auth.admin.createUser error:", authError?.message);
      throw new Error(authError?.message || "Erreur de création du compte client.");
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email: emailNormalized,
      phone_number: phoneNormalized,
      role: "CUSTOMER",
    });

    if (profileError) {
      console.error("[CustomerRepository] Profile upsert error:", profileError.message);
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      throw new Error("Impossible de créer le profil client (email ou téléphone en double).");
    }

    // Create loyalty record
    await adminClient.from("customers").upsert({
      id: userId,
      loyalty_points: 0,
      status: "BRONZE",
    });

    return { id: userId, email: emailNormalized };
  }

  async updateLoyaltyPoints(id: string, availablePoints: number, tier?: LoyaltyTier): Promise<void> {
    const sb = await this.getClient();
    const payload: { loyalty_points: number; status?: LoyaltyTier; updated_at: string } = {
      loyalty_points: availablePoints,
      updated_at: new Date().toISOString(),
    };

    if (tier) {
      payload.status = tier;
    }

    const { error } = await sb.from("customers").upsert({
      id,
      ...payload,
    });

    if (error) {
      console.error("[SupabaseCustomerRepository] updateLoyaltyPoints error:", error);
      throw new Error("Impossible de mettre à jour le solde de points.");
    }
  }
}
