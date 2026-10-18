import { ITokenUseRepository } from "../ports";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

/**
 * Infrastructure Adapter implementing ITokenUseRepository via the `auth_token_uses` table.
 */
export class SupabaseTokenUseRepository implements ITokenUseRepository {
  async consume(jti: string, expiresAt: number): Promise<boolean> {
    const adminClient = createAdminClient();

    // Housekeeping: drop records of tokens that can no longer be used anyway
    await adminClient.from("auth_token_uses").delete().lt("expires_at", new Date().toISOString());

    const { error } = await adminClient
      .from("auth_token_uses")
      .insert({ jti, expires_at: new Date(expiresAt).toISOString() });

    if (!error) {
      return true;
    }
    if (error.code === UNIQUE_VIOLATION) {
      return false;
    }
    // Registry unavailable: fail closed rather than allowing token replay
    console.error("[TokenUseRepository] consume error:", error.message);
    throw new Error("Token registry unavailable.");
  }

  async release(jti: string): Promise<void> {
    const adminClient = createAdminClient();
    await adminClient.from("auth_token_uses").delete().eq("jti", jti);
  }
}
