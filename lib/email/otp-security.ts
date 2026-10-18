import crypto from "crypto";

export const PENDING_RESET_COOKIE = "sm_pending_reset";
export const PENDING_SIGNUP_COOKIE = "sm_pending_signup";

export interface PendingResetPayload {
  email: string;
  type?: 'PASSWORD_RESET';
  /** Single-use id (absent on tokens issued before single-use links) */
  jti?: string;
  expiresAt: number;
}

export interface AccountActivationPayload {
  email: string;
  role: 'CUSTOMER' | 'CASHIER' | 'ADMIN';
  type: 'ACCOUNT_ACTIVATION';
  /** Single-use id (absent on tokens issued before single-use links) */
  jti?: string;
  expiresAt: number;
}

/**
 * Secrets used to sign and verify tokens, primary first.
 *
 * SECURITY: never fall back to a public value (e.g. NEXT_PUBLIC_SUPABASE_ANON_KEY)
 * or to a literal committed in the source code — anyone could forge tokens.
 * - AUTH_TOKEN_SECRET: dedicated signing secret (recommended, 32+ random bytes).
 * - NEXT_BREVO_API_KEY: legacy signing secret, kept so links already sent stay valid.
 * - SUPABASE_SERVICE_ROLE_KEY: server-only last resort, never used raw (derived key).
 */
function getTokenSecrets(): string[] {
  const secrets: string[] = [];
  const dedicated = process.env.AUTH_TOKEN_SECRET;
  const legacy = process.env.NEXT_BREVO_API_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (dedicated) secrets.push(dedicated);
  if (legacy) secrets.push(legacy);
  if (!secrets.length && serviceRoleKey) {
    secrets.push(crypto.createHmac("sha256", serviceRoleKey).update("sm-auth-token-v1").digest("hex"));
  }

  if (!secrets.length) {
    throw new Error("Configuration error: AUTH_TOKEN_SECRET is not set.");
  }
  return secrets;
}

function getPrimarySecret(): string {
  return getTokenSecrets()[0];
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically secure 6-digit OTP code (e.g. "492815")
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP code with a server-side key (HMAC-SHA256).
 * Keyed so the 6-digit space cannot be brute-forced offline from the hash.
 */
export function hashOtp(otp: string, secret: string = getPrimarySecret()): string {
  return crypto.createHmac("sha256", secret).update(`otp:${otp.trim()}`).digest("hex");
}

/**
 * Constant-time check of an OTP code against a hash produced by `hashOtp`.
 * Also accepts hashes issued before keyed hashing (unsalted SHA-256).
 */
export function verifyOtpHash(otp: string, expectedHash: string): boolean {
  const candidates = getTokenSecrets().map((secret) => hashOtp(otp, secret));
  candidates.push(crypto.createHash("sha256").update(otp.trim()).digest("hex"));
  return candidates.some((hash) => safeEqual(hash, expectedHash));
}

/**
 * Creates an HMAC-SHA256 signed token carrying an arbitrary payload.
 * The payload is readable by the holder: never put secrets in it (see `createEncryptedToken`).
 */
export function createSignedToken<T extends object>(payload: T, secret: string = getPrimarySecret()): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verifies and decodes an HMAC-SHA256 signed token
 */
export function verifySignedToken<T extends object>(token: string, secret?: string): T | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const secrets = secret ? [secret] : getTokenSecrets();
  const isValid = secrets.some((candidate) => {
    const expectedSignature = crypto
      .createHmac("sha256", candidate)
      .update(data)
      .digest("base64url");
    // Constant-time comparison to prevent timing attacks
    return safeEqual(signature, expectedSignature);
  });

  if (!isValid) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

const ENCRYPTED_TOKEN_PREFIX = "v2";

function deriveEncryptionKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(`sm-token-encryption:${secret}`).digest();
}

/**
 * Creates an AES-256-GCM encrypted (confidential + tamper-proof) token.
 * Use for payloads the holder must not read, e.g. a pending signup password.
 */
export function createEncryptedToken<T extends object>(payload: T, secret: string = getPrimarySecret()): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveEncryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENCRYPTED_TOKEN_PREFIX, iv, ciphertext, tag]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

/**
 * Decrypts a token produced by `createEncryptedToken`. Returns null if invalid or tampered.
 */
export function decryptToken<T extends object>(token: string, secret?: string): T | null {
  const parts = token?.split(".") ?? [];
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_TOKEN_PREFIX) {
    return null;
  }

  const [, ivPart, ciphertextPart, tagPart] = parts;
  const secrets = secret ? [secret] : getTokenSecrets();

  for (const candidate of secrets) {
    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        deriveEncryptionKey(candidate),
        Buffer.from(ivPart, "base64url")
      );
      decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, "base64url")),
        decipher.final(),
      ]).toString("utf8");
      return JSON.parse(plaintext) as T;
    } catch {
      // Wrong key or tampered token: try the next secret
    }
  }
  return null;
}

/**
 * Signs a value for a given purpose (e.g. an email address in an unsubscribe link).
 * The purpose is part of the MAC so a signature cannot be reused in another flow.
 */
export function signValue(purpose: string, value: string, secret: string = getPrimarySecret()): string {
  return crypto.createHmac("sha256", secret).update(`${purpose}:${value}`).digest("base64url");
}

/**
 * Constant-time verification of a signature produced by `signValue`.
 */
export function verifySignedValue(purpose: string, value: string, signature: string | null | undefined): boolean {
  if (!signature) {
    return false;
  }
  return getTokenSecrets().some((secret) => safeEqual(signValue(purpose, value, secret), signature));
}

/**
 * Verifies a password-reset token. Rejects any other signed token type
 * (e.g. an account-activation token) so tokens cannot be used across flows.
 */
export function verifyPasswordResetToken(token: string): PendingResetPayload | null {
  const payload = verifySignedToken<PendingResetPayload & { type?: string; password?: unknown }>(token);
  if (!payload || typeof payload.email !== "string" || typeof payload.expiresAt !== "number") {
    return null;
  }
  // Tokens issued before typed reset tokens have no `type`: still accepted until they expire (60 min).
  if ((payload.type !== undefined && payload.type !== "PASSWORD_RESET") || "password" in payload) {
    return null;
  }
  return payload;
}
