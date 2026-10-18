/**
 * Email Service Domain Types
 * Strict typing for Hexagonal Architecture Ports and Adapters
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailSender {
  email: string;
  name: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: EmailSender;
  replyTo?: EmailRecipient;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerificationOtpEmailProps {
  email: string;
  name?: string;
  otp: string;
  expiresInMinutes?: number;
  sender?: EmailSender;
}

export interface PasswordResetEmailProps {
  email: string;
  name?: string;
  resetLink?: string;
  resetCode?: string;
  expiresInMinutes?: number;
  sender?: EmailSender;
}

export interface AccountActivationEmailProps {
  email: string;
  name?: string;
  activationLink: string;
  role: 'CUSTOMER' | 'CASHIER' | 'ADMIN';
  expiresInDays?: number;
  sender?: EmailSender;
}

export interface UnsubscribeConfirmationEmailProps {
  email: string;
  /** Signed link that unsubscribes this address when opened */
  unsubscribeLink: string;
  sender?: EmailSender;
}

export interface EmailTemplateResult {
  subject: string;
  html: string;
  text: string;
}
