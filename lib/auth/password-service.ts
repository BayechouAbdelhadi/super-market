import {
  verifySignedToken,
  verifyPasswordResetToken,
  AccountActivationPayload,
} from "@/lib/email/otp-security";
import { IUserAccountRepository, ITokenUseRepository } from "./ports";
import { SupabaseUserAccountRepository } from "./adapters/supabase-user-account-repository";
import { SupabaseTokenUseRepository } from "./adapters/supabase-token-use-repository";
import type { AppRole } from "./roles";

export type PasswordTokenFlow = "PASSWORD_RESET" | "ACCOUNT_ACTIVATION";

export type SetPasswordFromTokenResult =
  | { ok: true; email: string; role?: AppRole }
  | { ok: false; reason: "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED" | "UNAVAILABLE" }
  | { ok: false; reason: "ACCOUNT_NOT_FOUND"; email: string }
  | { ok: false; reason: "UPDATE_FAILED"; email: string; detail: string };

export interface PasswordServiceDeps {
  accounts: IUserAccountRepository;
  tokenUses: ITokenUseRepository;
  now?: () => number;
}

const defaultDeps: PasswordServiceDeps = {
  accounts: new SupabaseUserAccountRepository(),
  tokenUses: new SupabaseTokenUseRepository(),
};

interface VerifiedToken {
  email: string;
  expiresAt: number;
  jti?: string;
  role?: AppRole;
}

function readToken(flow: PasswordTokenFlow, token: string): VerifiedToken | null {
  if (!token) return null;
  if (flow === "PASSWORD_RESET") {
    return verifyPasswordResetToken(token);
  }
  const payload = verifySignedToken<AccountActivationPayload>(token);
  return payload?.type === "ACCOUNT_ACTIVATION" ? payload : null;
}

/**
 * Use case: set an account password from an emailed, signed token
 * (password reset or account activation).
 * The target account comes strictly from the signed token, never from the browser session.
 * Tokens carrying a `jti` are single-use.
 */
export async function setPasswordFromToken(
  input: { flow: PasswordTokenFlow; token: string; password: string },
  deps: PasswordServiceDeps = defaultDeps
): Promise<SetPasswordFromTokenResult> {
  const now = deps.now ?? Date.now;
  const payload = readToken(input.flow, input.token);

  if (!payload) {
    return { ok: false, reason: "INVALID_TOKEN" };
  }
  if (now() > payload.expiresAt) {
    return { ok: false, reason: "EXPIRED" };
  }

  const email = payload.email.toLowerCase().trim();
  const userId = await deps.accounts.findUserIdByEmail(email);
  if (!userId) {
    return { ok: false, reason: "ACCOUNT_NOT_FOUND", email };
  }

  if (payload.jti) {
    try {
      const firstUse = await deps.tokenUses.consume(payload.jti, payload.expiresAt);
      if (!firstUse) {
        return { ok: false, reason: "ALREADY_USED" };
      }
    } catch {
      return { ok: false, reason: "UNAVAILABLE" };
    }
  }

  const { error } = await deps.accounts.setPassword(userId, input.password, {
    confirmEmail: input.flow === "ACCOUNT_ACTIVATION",
  });

  if (error) {
    if (payload.jti) {
      await deps.tokenUses.release(payload.jti).catch(() => undefined);
    }
    return { ok: false, reason: "UPDATE_FAILED", email, detail: error };
  }

  return { ok: true, email, role: payload.role };
}
