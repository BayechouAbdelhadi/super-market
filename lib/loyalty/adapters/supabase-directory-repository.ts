import { IDirectoryRepository } from "../ports";
import { DirectoryUser, ProfileWithCustomerRow, UserRole } from "../types";
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
        id, first_name, last_name, email, phone_number, created_at, role, disabled_at,
        customers ( loyalty_points, status )
      `)
      .eq("role", "CUSTOMER")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as ProfileWithCustomerRow[] | null) || [];
  }

  async listRecentProfilesByRole(role: UserRole, limit: number): Promise<DirectoryUser[]> {
    const sb = await createServerClient();
    const { data } = await sb
      .from("profiles")
      .select("id, first_name, last_name, email, phone_number, role, created_at, disabled_at")
      .eq("role", role)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as DirectoryUser[] | null) || [];
  }
}
