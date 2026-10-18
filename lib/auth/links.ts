import crypto from "crypto";
import {
  createSignedToken,
  AccountActivationPayload,
  PendingResetPayload,
} from "@/lib/email/otp-security";
import { AUTH_CONFIG } from "./config";
import type { AppRole } from "./roles";

/**
 * Builds a single-use account activation link (valid AUTH_CONFIG.activationLinkTtlDays).
 * `origin` must come from `getAppOrigin` (never directly from request headers).
 */
export function createActivationLink(origin: string, email: string, role: AppRole): string {
  const token = createSignedToken<AccountActivationPayload>({
    email: email.toLowerCase().trim(),
    role,
    type: "ACCOUNT_ACTIVATION",
    jti: crypto.randomUUID(),
    expiresAt: Date.now() + AUTH_CONFIG.activationLinkTtlMs,
  });
  return `${origin}/confirm-account?token=${encodeURIComponent(token)}`;
}

/**
 * Creates a single-use password reset token (valid AUTH_CONFIG.passwordResetTtlMinutes).
 */
export function createPasswordResetToken(email: string): string {
  return createSignedToken<PendingResetPayload>({
    email: email.toLowerCase().trim(),
    type: "PASSWORD_RESET",
    jti: crypto.randomUUID(),
    expiresAt: Date.now() + AUTH_CONFIG.passwordResetTtlMinutes * 60 * 1000,
  });
}
