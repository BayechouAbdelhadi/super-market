import { IEmailService } from "./ports";
import {
  SendEmailOptions,
  EmailResult,
  VerificationOtpEmailProps,
  PasswordResetEmailProps,
  AccountActivationEmailProps,
  EmailSender,
} from "./types";
import { renderVerificationOtpEmail } from "./templates/verification-otp";
import { renderPasswordResetEmail } from "./templates/password-reset";
import { renderAccountActivationEmail } from "./templates/account-activation";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Brevo (formerly Sendinblue) Transactional Email Adapter
 * Implements IEmailService port in accordance with Hexagonal Architecture.
 */
export class BrevoEmailAdapter implements IEmailService {
  private apiKey: string;
  private defaultSender: EmailSender;

  constructor() {
    this.apiKey = process.env.NEXT_BREVO_API_KEY || "";
    this.defaultSender = {
      email: process.env.BREVO_SENDER_EMAIL || "abdelbayechou@gmail.com",
      name: process.env.BREVO_SENDER_NAME || "Super Market Calais",
    };
  }

  private getHeaders(): HeadersInit {
    if (!this.apiKey) {
      throw new Error("NEXT_BREVO_API_KEY environment variable is missing.");
    }
    return {
      "api-key": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    try {
      if (!this.apiKey) {
        console.warn("[BrevoEmailAdapter] NEXT_BREVO_API_KEY is not configured.");
        return {
          success: false,
          error: "Clé API Brevo (NEXT_BREVO_API_KEY) non configurée.",
        };
      }

      const sender = options.sender || this.defaultSender;

      const payload = {
        sender: {
          name: sender.name,
          email: sender.email,
        },
        to: options.to.map((recipient) => ({
          email: recipient.email,
          ...(recipient.name ? { name: recipient.name } : {}),
        })),
        subject: options.subject,
        htmlContent: options.htmlContent,
        ...(options.textContent ? { textContent: options.textContent } : {}),
        ...(options.replyTo
          ? {
              replyTo: {
                email: options.replyTo.email,
                ...(options.replyTo.name ? { name: options.replyTo.name } : {}),
              },
            }
          : {}),
      };

      const response = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { message?: string })?.message ||
          `Erreur HTTP Brevo: ${response.status} ${response.statusText}`;
        console.error("[BrevoEmailAdapter] Send failed:", errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = (await response.json().catch(() => ({}))) as {
        messageId?: string;
      };

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      const err = error instanceof Error ? error.message : "Erreur réseau inconnue";
      console.error("[BrevoEmailAdapter] Exception during send:", err);
      return {
        success: false,
        error: err,
      };
    }
  }

  async sendVerificationOtp(props: VerificationOtpEmailProps): Promise<EmailResult> {
    const { subject, html, text } = renderVerificationOtpEmail(props);
    return await this.sendEmail({
      to: [{ email: props.email, name: props.name }],
      subject,
      htmlContent: html,
      textContent: text,
    });
  }

  async sendPasswordReset(props: PasswordResetEmailProps): Promise<EmailResult> {
    const { subject, html, text } = renderPasswordResetEmail(props);
    return await this.sendEmail({
      to: [{ email: props.email, name: props.name }],
      subject,
      htmlContent: html,
      textContent: text,
    });
  }

  async sendAccountActivation(props: AccountActivationEmailProps): Promise<EmailResult> {
    const { subject, html, text } = renderAccountActivationEmail(props);
    return await this.sendEmail({
      to: [{ email: props.email, name: props.name }],
      subject,
      htmlContent: html,
      textContent: text,
    });
  }
}
