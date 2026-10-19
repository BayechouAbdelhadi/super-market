import { emailService } from "./index";
import type { EmailResult, EmailSender } from "./types";
import { createActivationLink } from "@/lib/auth/links";
import { AUTH_CONFIG } from "@/lib/auth/config";
import type { AppRole } from "@/lib/auth/roles";
import type { AppSettings } from "@/lib/settings/types";

export interface ActivationAccount {
  email: string;
  name: string;
  role: AppRole;
}

/** Configured sender for transactional emails, or undefined to use the provider default. */
export function activationSender(settings: AppSettings): EmailSender | undefined {
  const { senderEmail, senderName } = settings.notifications;
  return senderEmail ? { email: senderEmail, name: senderName || settings.store.storeName } : undefined;
}

/** Whether a newly created account of this role gets an activation email automatically. */
export function shouldSendActivationEmail(role: AppRole, settings: AppSettings): boolean {
  return role === "CASHIER"
    ? settings.notifications.sendCashierInviteEmail
    : settings.notifications.sendWelcomeEmail;
}

/**
 * Builds a fresh single-use activation link and emails it with the configured sender.
 * `origin` must come from `getAppOrigin`.
 */
export function sendActivationEmail(
  account: ActivationAccount,
  origin: string,
  settings: AppSettings
): Promise<EmailResult> {
  return emailService.sendAccountActivation({
    email: account.email,
    name: account.name,
    activationLink: createActivationLink(origin, account.email, account.role),
    role: account.role,
    expiresInDays: AUTH_CONFIG.activationLinkTtlDays,
    sender: activationSender(settings),
  });
}
