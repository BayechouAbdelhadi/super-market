import { AudienceCustomerRow, ICampaignAudienceRepository } from "../ports";
import { createClient } from "@/lib/supabase/server";

/** PostgREST returns at most 1000 rows per request: read the audience in pages of that size. */
const AUDIENCE_PAGE_SIZE = 1000;

/**
 * Infrastructure Adapter implementing ICampaignAudienceRepository via Supabase (caller's RLS session).
 */
export class SupabaseCampaignAudienceRepository implements ICampaignAudienceRepository {
  async listCustomersWithEmail(): Promise<AudienceCustomerRow[]> {
    const sb = await createClient();
    const rows: AudienceCustomerRow[] = [];

    for (let offset = 0; ; offset += AUDIENCE_PAGE_SIZE) {
      const { data, error } = await sb
        .from("profiles")
        .select(`
          id, first_name, last_name, email,
          customers ( loyalty_points, status )
        `)
        .eq("role", "CUSTOMER")
        .not("email", "is", null)
        .order("id", { ascending: true })
        .range(offset, offset + AUDIENCE_PAGE_SIZE - 1);

      if (error || !data) {
        console.error("[CampaignAudienceRepository] Error fetching targeted customers:", error);
        // Same contract as before: an error yields no audience rather than a partial one
        return [];
      }

      rows.push(...(data as AudienceCustomerRow[]));
      if (data.length < AUDIENCE_PAGE_SIZE) {
        return rows;
      }
    }
  }
}
