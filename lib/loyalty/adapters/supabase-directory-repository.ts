import { IDirectoryRepository } from "../ports";
import { ProfileWithCustomerRow, UserRole } from "../types";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Infrastructure Adapter implementing IDirectoryRepository via Supabase (caller's RLS session).
 */
export class SupabaseDirectoryRepository implements IDirectoryRepository {
  async listRecentCustomers(limit: number): Promise<ProfileWithCustomerRow[]> {
    const sb = await createServerClient();
    const { data } = await sb
      .from("profiles")
      .select(`
        id, first_name, last_name, email, phone_number, created_at, role,
        customers ( loyalty_points, status )
      `)
      .eq("role", "CUSTOMER")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ProfileWithCustomerRow[] | null) || [];
  }

  async listRecentProfilesByRole(role: UserRole, limit: number): Promise<Record<string, unknown>[]> {
    const sb = await createServerClient();
    const { data } = await sb
      .from("profiles")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  }
}
