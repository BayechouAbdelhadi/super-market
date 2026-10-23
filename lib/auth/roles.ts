import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AppRole = "ADMIN" | "CASHIER" | "CUSTOMER";

const APP_ROLES: readonly AppRole[] = ["ADMIN", "CASHIER", "CUSTOMER"];

function asAppRole(value: unknown): AppRole | null {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value)
    ? (value as AppRole)
    : null;
}

/**
 * Resolves the caller's role from trusted sources only.
 *
 * SECURITY: `user_metadata` is writable by the user themselves
 * (`supabase.auth.updateUser({ data })` with the public anon key), so it must
 * never be used for authorization. The role comes from `profiles.role`
 * (protected by RLS: users cannot change their own role), then from
 * `app_metadata.role` (writable only with the service role key).
 * Anything else falls back to the least-privileged role.
 */
export async function resolveUserRole(supabase: SupabaseClient, user: User): Promise<AppRole> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[resolveUserRole] Unable to read profile role:", error.message);
  }

  return asAppRole(profile?.role) ?? asAppRole(user.app_metadata?.role) ?? "CUSTOMER";
}

/** Disabled accounts keep a valid access token until it expires: reject them right away. */
export function isBanned(user: User): boolean {
  return !!user.banned_until && new Date(user.banned_until).getTime() > Date.now();
}
