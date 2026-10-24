import { IDirectoryRepository, Page } from "../ports";
import { DirectoryUser, ProfileWithCustomerRow, UserRole } from "../types";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { normalizeSearchTerm } from "./search-term";

/**
 * Infrastructure Adapter implementing IDirectoryRepository via Supabase (caller's RLS session).
 */
export class SupabaseDirectoryRepository implements IDirectoryRepository {
  async listCustomersPage(query: string, limit: number, offset: number): Promise<Page<ProfileWithCustomerRow>> {
    const sb = await createServerClient();
    let dbQuery = sb
      .from("profiles")
      .select(`
        id, first_name, last_name, email, phone_number, created_at, role, disabled_at,
        customers ( loyalty_points, status )
      `, { count: "exact" })
      .eq("role", "CUSTOMER");

    const term = normalizeSearchTerm(query);
    if (term) {
      dbQuery = dbQuery.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone_number.ilike.%${term}%`
      );
    }

    const { data, count } = await dbQuery
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);
    const items = (data as ProfileWithCustomerRow[] | null) || [];
    return { items, total: count ?? items.length };
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
