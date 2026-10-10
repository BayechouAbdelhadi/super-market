import { IEmailService } from "./ports";
import { BrevoEmailAdapter } from "./brevo-adapter";

export * from "./types";
export * from "./ports";
export * from "./brevo-adapter";
export * from "./templates/verification-otp";
export * from "./templates/password-reset";

/**
 * Singleton instance of the email service
 */
export const emailService: IEmailService = new BrevoEmailAdapter();
