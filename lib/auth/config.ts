/**
 * Central auth configuration (token lifetimes, OTP windows).
 */
const MINUTE = 60 * 1000;

export const AUTH_CONFIG = {
  /** Account activation / invitation link lifetime */
  activationLinkTtlMs: 7 * 24 * 60 * MINUTE,
  activationLinkTtlDays: 7,
  /** Password reset link lifetime */
  passwordResetTtlMinutes: 60,
  /** Signup confirmation code (OTP) lifetime */
  signupOtpTtlMinutes: 15,
} as const;
