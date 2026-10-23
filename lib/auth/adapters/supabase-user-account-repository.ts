import crypto from "crypto";
import { AccountProfile, AuthFailureCode, CreateAccountResult, IUserAccountRepository, NewAccountInput } from "../ports";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOYALTY_CONFIG } from "@/lib/loyalty/config";

const AUTH_USERS_PAGE_SIZE = 1000;
/** GoTrue has no permanent ban: ~100 years. */
const PERMANENT_BAN_DURATION = "876000h";

/** Random initial password for accounts activated later through an emailed link. */
function generateInitialPassword(): string {
  return crypto.randomBytes(16).toString("hex") + "A1!";
}

/** Maps GoTrue error codes (and legacy messages) to provider-agnostic failure codes. */
function toAuthFailureCode(error: { code?: string; message?: string } | null): AuthFailureCode {
  const code = error?.code ?? "";
  const message = error?.message?.toLowerCase() ?? "";
  if (code === "email_exists" || code === "user_already_exists" || message.includes("already")) return "EMAIL_TAKEN";
  if (code === "weak_password") return "WEAK_PASSWORD";
  if (code === "email_address_invalid" || code === "validation_failed") return "INVALID_EMAIL";
  if (code.startsWith("over_") || code === "too_many_requests") return "RATE_LIMITED";
  return "UNKNOWN";
}

/**
 * Infrastructure Adapter implementing IUserAccountRepository via Supabase Auth (service role).
 */
export class SupabaseUserAccountRepository implements IUserAccountRepository {
  async findConflict(email: string, phone: string): Promise<"email" | "phone" | null> {
    const adminClient = createAdminClient();
    // email is Zod-validated and phone is digits-only: safe inside the `.or()` filter
    const { data } = await adminClient
      .from("profiles")
      .select("id, email, phone_number")
      .or(`email.eq.${email},phone_number.eq.${phone}`)
      .limit(1);

    if (!data || data.length === 0) {
      return null;
    }
    return data[0].email?.toLowerCase() === email ? "email" : "phone";
  }

  async createAccount(input: NewAccountInput): Promise<CreateAccountResult> {
    const adminClient = createAdminClient();

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password || generateInitialPassword(),
      email_confirm: true,
      // Display data only: roles are NEVER read from user_metadata (user-editable)
      user_metadata: {
        first_name: input.firstName,
        last_name: input.lastName,
        phone_number: input.phone,
        role: input.role,
      },
    });

    if (authError || !authData.user) {
      console.error(`[UserAccountRepository] auth.admin.createUser error (${input.email}):`, authError?.message);
      return { ok: false, reason: "AUTH_FAILED", code: toAuthFailureCode(authError) };
    }

    const userId = authData.user.id;

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone_number: input.phone,
      role: input.role,
    });

    if (profileError) {
      console.error("[UserAccountRepository] Profile upsert error:", profileError.message);
      await adminClient.auth.admin.deleteUser(userId).catch(() => null);
      return { ok: false, reason: "PROFILE_FAILED" };
    }

    if (input.role === "CUSTOMER") {
      const { error: loyaltyError } = await adminClient.from("customers").upsert({
        id: userId,
        loyalty_points: 0,
        status: LOYALTY_CONFIG.defaults.tier,
      });

      if (loyaltyError) {
        console.error("[UserAccountRepository] Loyalty record upsert error:", loyaltyError.message);
        // Profile row is removed by ON DELETE CASCADE
        await adminClient.auth.admin.deleteUser(userId).catch(() => null);
        return { ok: false, reason: "LOYALTY_RECORD_FAILED" };
      }
    }

    return { ok: true, id: userId };
  }

  async findProfileByEmail(email: string): Promise<AccountProfile | null> {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("profiles")
      .select("id, email, first_name, last_name, role")
      .eq("email", email)
      .limit(1);
    return (data?.[0] as AccountProfile | undefined) ?? null;
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const adminClient = createAdminClient();
    const target = email.toLowerCase().trim();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", target)
      .maybeSingle();

    if (profile?.id) {
      return profile.id;
    }

    // Fallback for auth accounts without a profile row: page through all auth users
    for (let page = 1; ; page++) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: AUTH_USERS_PAGE_SIZE });
      if (error || !data) {
        console.error("[UserAccountRepository] listUsers error:", error?.message);
        return null;
      }
      const matched = data.users.find((u) => u.email?.toLowerCase().trim() === target);
      if (matched) {
        return matched.id;
      }
      if (data.users.length < AUTH_USERS_PAGE_SIZE) {
        return null;
      }
    }
  }

  async setPassword(userId: string, password: string, options?: { confirmEmail?: boolean }): Promise<{ error?: string }> {
    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password,
      ...(options?.confirmEmail ? { email_confirm: true } : {}),
    });
    return error ? { error: error.message } : {};
  }

  async setDisabled(userId: string, disabled: boolean): Promise<{ error?: string }> {
    const adminClient = createAdminClient();
    const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: disabled ? PERMANENT_BAN_DURATION : "none",
    });
    if (authError) {
      console.error(`[UserAccountRepository] ban update error (${userId}):`, authError.message);
      return { error: authError.message };
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ disabled_at: disabled ? new Date().toISOString() : null })
      .eq("id", userId);
    if (profileError) {
      console.error(`[UserAccountRepository] disabled_at update error (${userId}):`, profileError.message);
      // Keep auth and profile consistent
      await adminClient.auth.admin.updateUserById(userId, { ban_duration: disabled ? "none" : PERMANENT_BAN_DURATION }).catch(() => null);
      return { error: profileError.message };
    }
    return {};
  }
}
