import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildUnsubscribeUrl, requestUnsubscribeConfirmation, UnsubscribeRequestDeps } from "@/lib/marketing/service";
import { verifySignedValue } from "@/lib/email/otp-security";
import { UNSUBSCRIBE_SIGNATURE_PURPOSE } from "@/lib/marketing/utils";
import { renderUnsubscribeConfirmationEmail, renderVerificationOtpEmail } from "@/lib/email";
import { IMarketingCampaignRepository } from "@/lib/marketing/ports";

function makeDeps(options: { role?: "CUSTOMER" | "CASHIER" | null; unsubscribed?: boolean } = {}) {
  const sent: Array<{ email: string; unsubscribeLink: string }> = [];
  const deps: UnsubscribeRequestDeps = {
    accounts: {
      findProfileByEmail: async (email: string) =>
        options.role === null
          ? null
          : { id: "u1", email, first_name: null, last_name: null, role: options.role ?? "CUSTOMER" },
    },
    mailer: {
      sendUnsubscribeConfirmation: async (props) => {
        sent.push(props);
        return { success: true };
      },
    },
    repo: { isUnsubscribed: async () => options.unsubscribed ?? false } as unknown as IMarketingCampaignRepository,
  };
  return { deps, sent };
}

describe("Unsubscribe double opt-out", () => {
  beforeEach(() => vi.stubEnv("AUTH_TOKEN_SECRET", "test-auth-token-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("builds links whose signature matches only their own address", () => {
    const url = new URL(buildUnsubscribeUrl("https://shop.test", "  Client@Example.com "));
    const email = url.searchParams.get("email")!;
    const sig = url.searchParams.get("sig")!;

    expect(email).toBe("client@example.com");
    expect(verifySignedValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, email, sig)).toBe(true);
    expect(verifySignedValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, "other@example.com", sig)).toBe(false);
  });

  it("emails a signed confirmation link to subscribed customers", async () => {
    const { deps, sent } = makeDeps();
    await requestUnsubscribeConfirmation("client@example.com", "https://shop.test", deps);

    expect(sent).toHaveLength(1);
    const link = new URL(sent[0].unsubscribeLink);
    expect(link.origin + link.pathname).toBe("https://shop.test/unsubscribe");
    expect(verifySignedValue(UNSUBSCRIBE_SIGNATURE_PURPOSE, "client@example.com", link.searchParams.get("sig"))).toBe(true);
  });

  it("sends nothing for unknown addresses, staff accounts or already-unsubscribed customers", async () => {
    for (const options of [{ role: null }, { role: "CASHIER" as const }, { unsubscribed: true }]) {
      const { deps, sent } = makeDeps(options);
      await requestUnsubscribeConfirmation("someone@example.com", "https://shop.test", deps);
      expect(sent).toHaveLength(0);
    }
  });
});

describe("Email HTML escaping", () => {
  it("never injects user-supplied names as HTML", () => {
    const { html, text } = renderVerificationOtpEmail({
      email: "victim@example.com",
      name: '<a href="https://evil.tld">Cliquez ici</a>',
      otp: "123456",
    });
    expect(html).not.toContain('<a href="https://evil.tld">');
    expect(html).toContain("&lt;a href=&quot;https://evil.tld&quot;&gt;");
    expect(text).toContain("Cliquez ici");
  });

  it("escapes the confirmation link in the unsubscribe email", () => {
    const { html } = renderUnsubscribeConfirmationEmail({
      email: "a@b.c",
      unsubscribeLink: 'https://shop.test/unsubscribe?email=a%40b.c&sig="x"',
    });
    expect(html).toContain("&amp;sig=&quot;x&quot;");
  });
});
