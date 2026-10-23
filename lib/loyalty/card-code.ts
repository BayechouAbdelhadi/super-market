import { LOYALTY_CONFIG } from "./config";
import { CustomerIdSchema } from "./validation";

/** Text encoded in the QR code of a customer's digital loyalty card. */
export function encodeLoyaltyCardCode(customerId: string): string {
  return `${LOYALTY_CONFIG.card.qrPrefix}${customerId}`;
}

/**
 * Reads a scanned loyalty card code.
 * @returns The customer id, or `null` when the code is not a loyalty card.
 */
export function parseLoyaltyCardCode(text: string): string | null {
  const value = text.trim();
  if (!value.startsWith(LOYALTY_CONFIG.card.qrPrefix)) return null;
  const parsed = CustomerIdSchema.safeParse(value.slice(LOYALTY_CONFIG.card.qrPrefix.length));
  return parsed.success ? parsed.data : null;
}
