import { createAdminClient } from "@/lib/supabase/admin";
import type { ISiteAlertRepository } from "../ports";
import type { AlertLevel, NewSiteAlert, SiteAlert, SiteAlertPage } from "../types";

const TABLE = "site_alerts";
const COLUMNS = "id, message, level, is_active, created_at, created_by";

interface SiteAlertRow {
  id: string;
  message: string;
  level: AlertLevel;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

function toAlert(row: SiteAlertRow): SiteAlert {
  return {
    id: row.id,
    message: row.message,
    level: row.level,
    isActive: row.is_active,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

/** Throws a descriptive error for a failed Supabase call, so callers never mistake a failure for success. */
function check(error: { message: string; code?: string } | null, operation: string): void {
  if (error) {
    throw new Error(`[SupabaseSiteAlertRepo] ${operation} failed: ${error.message}${error.code ? ` (${error.code})` : ""}`);
  }
}

/**
 * Infrastructure Adapter: alerts stored in the Supabase `site_alerts` table.
 */
export class SupabaseSiteAlertRepository implements ISiteAlertRepository {
  async list(offset: number, limit: number): Promise<SiteAlertPage> {
    const { data, error, count } = await createAdminClient()
      .from(TABLE)
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    check(error, "list");
    return { items: (data ?? []).map(toAlert), total: count ?? 0 };
  }

  async listActive(limit: number): Promise<SiteAlert[]> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .select(COLUMNS)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    check(error, "listActive");
    return (data ?? []).map(toAlert);
  }

  async create(alert: NewSiteAlert): Promise<SiteAlert> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .insert({ message: alert.message, level: alert.level, created_by: alert.createdBy })
      .select(COLUMNS)
      .single();
    check(error, "create");
    return toAlert(data as SiteAlertRow);
  }

  async setActive(id: string, isActive: boolean): Promise<SiteAlert | null> {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .update({ is_active: isActive })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    check(error, "setActive");
    return data ? toAlert(data as SiteAlertRow) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await createAdminClient().from(TABLE).delete().eq("id", id).select("id");
    check(error, "delete");
    return (data ?? []).length > 0;
  }
}
