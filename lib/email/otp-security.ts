import crypto from "crypto";

const DEFAULT_SECRET =
  process.env.NEXT_BREVO_API_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "super-market-calais-secure-otp-salt";

export const PENDING_RESET_COOKIE = "sm_pending_reset";
export const PENDING_SIGNUP_COOKIE = "sm_pending_signup";

export interface PendingResetPayload {
  email: string;
  codeHash: string;
  expiresAt: number;
}

export interface AccountActivationPayload {
  email: string;
  role: 'CUSTOMER' | 'CASHIER' | 'ADMIN';
  type: 'ACCOUNT_ACTIVATION';
  expiresAt: number;
}

/**
 * Generates a cryptographically secure 6-digit OTP code (e.g. "492815")
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP code for safe comparison and storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Creates an HMAC-SHA256 signed token carrying an arbitrary payload
 */
export function createSignedToken<T extends object>(payload: T, secret: string = DEFAULT_SECRET): string {
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
export function verifySignedToken<T extends object>(token: string, secret: string = DEFAULT_SECRET): T | null {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [data, signature] = token.split(".");
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(data, "base64url").toString("utf-8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}
