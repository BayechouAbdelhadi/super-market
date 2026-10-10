import {
  SendEmailOptions,
  EmailResult,
  VerificationOtpEmailProps,
  PasswordResetEmailProps,
} from "./types";

/**
 * Port Interface for Email Service
 * In accordance with Hexagonal Architecture (AGENTS.md Section 1),
 * domain and application logic depend ONLY on this port interface.
 */
export interface IEmailService {
  /**
   * Generic low-level method to send transactional email
   */
  sendEmail(options: SendEmailOptions): Promise<EmailResult>;

  /**
   * Sends a 6-digit confirmation OTP email when a customer creates an account
   */
  sendVerificationOtp(props: VerificationOtpEmailProps): Promise<EmailResult>;

  /**
   * Sends a password reset email with secure link and/or recovery OTP code
   */
  sendPasswordReset(props: PasswordResetEmailProps): Promise<EmailResult>;
}
