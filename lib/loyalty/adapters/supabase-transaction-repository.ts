import { ITransactionRepository } from "../ports";
import { Transaction } from "../types";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { LOYALTY_CONFIG } from "../config";

/**
 * Infrastructure Adapter implementing ITransactionRepository via Supabase.
 * Encapsulates all SQL/Supabase interactions for transactions (Hexagonal Architecture).
 */
export class SupabaseTransactionRepository implements ITransactionRepository {
  private async getClient() {
    return await createServerClient();
  }

  async create(data: {
    customerId: string;
    cashierId: string | null;
    amount: number;
    pointsEarned: number;
    pointsRedeemed: number;
  }): Promise<Transaction> {
    const sb = await this.getClient();

    let activeCashierId = data.cashierId;
    if (!activeCashierId) {
      const { data: { user } } = await sb.auth.getUser();
      activeCashierId = user?.id || null;
    }

    const { data: tx, error } = await sb
      .from("transactions")
      .insert({
        customer_id: data.customerId,
        cashier_id: activeCashierId,
        amount_total: data.amount,
        points_earned: data.pointsEarned,
        points_redeemed: data.pointsRedeemed,
      })
      .select()
      .single();

    if (error || !tx) {
      console.error("[SupabaseTransactionRepository] create error:", error);
      throw new Error(error?.message || "Impossible d'enregistrer la transaction.");
    }

    return tx as Transaction;
  }

  async getByCustomerId(
    customerId: string,
    limit: number = LOYALTY_CONFIG.pagination.maxPageSize
  ): Promise<Transaction[]> {
    const sb = await this.getClient();
    const { data, error } = await sb
      .from("transactions")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error("[SupabaseTransactionRepository] getByCustomerId error:", error);
      return [];
    }

    return data as Transaction[];
  }
}
