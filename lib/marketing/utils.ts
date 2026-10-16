import { CampaignRecipient } from "./types";

/**
 * Strictly deduplicates recipients by both email and customer ID.
 * Guarantees that each recipient appears at most ONCE per campaign.
 * Prioritizes SENT or FAILED statuses over PENDING when duplicate records exist.
 */
export function deduplicateRecipients(recipients: CampaignRecipient[]): CampaignRecipient[] {
  if (!recipients || !Array.isArray(recipients)) return [];
  const seenCustomerIds = new Set<string>();
  const seenEmails = new Set<string>();
  const unique: CampaignRecipient[] = [];

  // Prioritize SENT (2) and FAILED (1) over PENDING (0)
  const prioritized = [...recipients].sort((a, b) => {
    const score = (r: CampaignRecipient) =>
      r.status === "SENT" ? 2 : r.status === "FAILED" ? 1 : 0;
    return score(b) - score(a);
  });

  for (const r of prioritized) {
    const emailKey = r.email ? r.email.trim().toLowerCase() : "";
    const custId = r.customerId ? r.customerId.trim() : "";

    if (emailKey && seenEmails.has(emailKey)) {
      continue;
    }
    if (custId && seenCustomerIds.has(custId)) {
      continue;
    }

    if (emailKey) seenEmails.add(emailKey);
    if (custId) seenCustomerIds.add(custId);
    unique.push(r);
  }

  return unique;
}
