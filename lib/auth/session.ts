import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isBanned, resolveUserRole, type AppRole } from "./roles";

export type SessionCaller =
  | { ok: true; supabase: SupabaseClient; user: User; role: AppRole }
  | { ok: false; reason: "UNAUTHENTICATED" }
  | { ok: false; reason: "FORBIDDEN"; supabase: SupabaseClient; user: User; role: AppRole };

/**
 * Single authentication + RBAC check for API routes and Server Actions.
 * Verifies the session with `getUser()` (server-validated) and resolves the role
 * from trusted sources only (see `resolveUserRole`).
 */
export async function getSessionCaller(allowedRoles?: readonly AppRole[]): Promise<SessionCaller> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || isBanned(user)) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const role = await resolveUserRole(supabase, user);
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { ok: false, reason: "FORBIDDEN", supabase, user, role };
  }

  return { ok: true, supabase, user, role };
}
