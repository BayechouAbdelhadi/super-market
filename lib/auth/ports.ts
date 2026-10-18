import type { AppRole } from "./roles";

export interface NewAccountInput {
  /** Already normalized (lowercase, trimmed) */
  email: string;
  firstName: string;
  lastName: string;
  /** Already normalized (digits only) */
  phone: string;
  role: AppRole;
  /** Chosen password; a random one is generated when omitted (set later via activation link) */
  password?: string;
}

export interface AccountProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
}

export type CreateAccountResult =
  | { ok: true; id: string }
  | { ok: false; reason: "AUTH_FAILED"; detail?: string }
  | { ok: false; reason: "PROFILE_FAILED" | "LOYALTY_RECORD_FAILED" };

/**
 * Domain Port: user account persistence (auth provider agnostic).
 */
export interface IUserAccountRepository {
  /** Which identifier (if any) is already used by an existing account. */
  findConflict(email: string, phone: string): Promise<"email" | "phone" | null>;
  /**
   * Creates the auth account, its profile and (for customers) the loyalty record.
   * All-or-nothing: on failure, already-created parts are rolled back.
   */
  createAccount(input: NewAccountInput): Promise<CreateAccountResult>;
  /** Profile of the account using this email, if any. */
  findProfileByEmail(email: string): Promise<AccountProfile | null>;
  /** Returns the account id for an email, or null when no account exists. */
  findUserIdByEmail(email: string): Promise<string | null>;
  /** Sets a new password; `confirmEmail` also marks the email as verified. */
  setPassword(userId: string, password: string, options?: { confirmEmail?: boolean }): Promise<{ error?: string }>;
}

/**
 * Domain Port: one-time token registry (makes emailed links single-use).
 */
export interface ITokenUseRepository {
  /** Records the token id as used. Returns false when it was already used. */
  consume(jti: string, expiresAt: number): Promise<boolean>;
  /** Cancels a consumption (e.g. the protected operation failed). */
  release(jti: string): Promise<void>;
}
