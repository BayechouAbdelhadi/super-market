import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  renderVerificationOtpEmail,
  renderPasswordResetEmail,
  renderAccountActivationEmail,
  BrevoEmailAdapter,
} from "@/lib/email";
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  createSignedToken,
  verifySignedToken,
  createEncryptedToken,
  decryptToken,
  verifyPasswordResetToken,
} from "@/lib/email/otp-security";

describe("Email Templates", () => {
  describe("renderVerificationOtpEmail", () => {
    it("renders verification email with OTP and custom recipient name", () => {
      const template = renderVerificationOtpEmail({
        email: "client@example.com",
        name: "Jean Dupont",
        otp: "847291",
        expiresInMinutes: 15,
      });

      expect(template.subject).toContain("847291");
      expect(template.subject).toContain("Super Market");
      expect(template.html).toContain("Bonjour Jean Dupont,");
      expect(template.html).toContain("847291");
      expect(template.html).toContain("15 minutes");
      expect(template.html).toContain("Super Market Calais");
      expect(template.text).toContain("847291");
      expect(template.text).toContain("Jean Dupont");
    });

    it("renders generic greeting when name is omitted", () => {
      const template = renderVerificationOtpEmail({
        email: "test@example.com",
        otp: "123456",
      });

      expect(template.html).toContain("Bonjour,");
      expect(template.html).toContain("123456");
    });
  });

  describe("renderPasswordResetEmail", () => {
    it("renders password reset email with direct reset button link", () => {
      const template = renderPasswordResetEmail({
        email: "client@example.com",
        name: "Marie Curie",
        resetLink: "https://supermarketcalais.com/reset-password?token=abc",
        expiresInMinutes: 60,
      });

      expect(template.subject).toContain("Réinitialisation");
      expect(template.html).toContain("Bonjour Marie Curie,");
      expect(template.html).toContain("https://supermarketcalais.com/reset-password?token=abc");
      expect(template.html).toContain("Réinitialiser mon mot de passe");
      expect(template.text).toContain("https://supermarketcalais.com/reset-password?token=abc");
    });
  });

  describe("renderAccountActivationEmail", () => {
    it("renders customer confirmation email mentioning account created at cash register", () => {
      const template = renderAccountActivationEmail({
        email: "client@example.com",
        name: "Alexandre Dumas",
        activationLink: "https://supermarketcalais.com/confirm-account?token=xyz",
        role: "CUSTOMER",
      });

      expect(template.subject).toContain("Activez votre compte fidélité");
      expect(template.html).toContain("Bonjour Alexandre Dumas,");
      expect(template.html).toContain("passage à la caisse");
      expect(template.html).toContain("https://supermarketcalais.com/confirm-account?token=xyz");
      expect(template.html).toContain("Confirmer et activer mon compte");
      expect(template.text).toContain("passage à la caisse");
    });

    it("renders cashier invitation email mentioning collaboration", () => {
      const template = renderAccountActivationEmail({
        email: "caissier@example.com",
        name: "Sophie Germain",
        activationLink: "https://supermarketcalais.com/confirm-account?token=cashier_token",
        role: "CASHIER",
      });

      expect(template.subject).toContain("Invitation à rejoindre l'équipe caisse");
      expect(template.html).toContain("Bonjour Sophie Germain,");
      expect(template.html).toContain("invité(e) en tant que caissier(e)");
      expect(template.html).toContain("https://supermarketcalais.com/confirm-account?token=cashier_token");
      expect(template.html).toContain("Activer mon compte caissier");
      expect(template.text).toContain("caissier(e)");
    });
  });
});

describe("OTP Security and Cryptography", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-auth-token-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("generates a 6-digit numeric OTP", () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateSecureOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    }
  });

  it("hashes OTP consistently with a keyed HMAC-SHA256", () => {
    const hash1 = hashOtp("123456");
    const hash2 = hashOtp("123456");
    const hash3 = hashOtp("654321");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it("signs and verifies token payloads", () => {
    const payload = { email: "test@example.com", otpHash: hashOtp("123456"), expiresAt: 123456789 };
    const token = createSignedToken(payload, "secret-key");

    const decoded = verifySignedToken<typeof payload>(token, "secret-key");
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe("test@example.com");
    expect(decoded?.otpHash).toBe(payload.otpHash);
  });

  it("rejects tampered or forged tokens", () => {
    const payload = { email: "test@example.com", otpHash: "abc" };
    const token = createSignedToken(payload, "secret-key");

    // Tamper payload data
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}xyz.${parts[1]}`;
    expect(verifySignedToken(tamperedToken, "secret-key")).toBeNull();

    // Wrong secret key
    expect(verifySignedToken(token, "wrong-secret")).toBeNull();
  });

  it("keys the OTP hash so it cannot be brute-forced without the secret", () => {
    expect(hashOtp("123456", "secret-a")).not.toBe(hashOtp("123456", "secret-b"));
    expect(verifyOtpHash("123456", hashOtp("123456"))).toBe(true);
    expect(verifyOtpHash("654321", hashOtp("123456"))).toBe(false);
  });

  it("never signs with the public anon key or a hardcoded fallback", () => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "");
    vi.stubEnv("NEXT_BREVO_API_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");

    expect(() => createSignedToken({ email: "a@b.c" })).toThrow();
  });

  it("encrypts payloads so the holder cannot read them", () => {
    const payload = { email: "test@example.com", password: "S3cret!Pass" };
    const token = createEncryptedToken(payload);

    expect(token).not.toContain(Buffer.from(JSON.stringify(payload)).toString("base64url"));
    expect(decryptToken<typeof payload>(token)).toEqual(payload);
    expect(decryptToken(token, "wrong-secret")).toBeNull();

    const parts = token.split(".");
    parts[2] = parts[2].slice(0, -2) + (parts[2].endsWith("A") ? "BB" : "AA");
    expect(decryptToken(parts.join("."))).toBeNull();
  });

  it("accepts reset tokens but rejects activation tokens in the reset flow", () => {
    const expiresAt = Date.now() + 60_000;
    const reset = createSignedToken({ email: "a@b.c", type: "PASSWORD_RESET", expiresAt });
    const legacyReset = createSignedToken({ email: "a@b.c", expiresAt });
    const activation = createSignedToken({ email: "a@b.c", role: "ADMIN", type: "ACCOUNT_ACTIVATION", expiresAt });

    expect(verifyPasswordResetToken(reset)?.email).toBe("a@b.c");
    expect(verifyPasswordResetToken(legacyReset)?.email).toBe("a@b.c");
    expect(verifyPasswordResetToken(activation)).toBeNull();
  });
});

describe("BrevoEmailAdapter", () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.NEXT_BREVO_API_KEY;

  beforeEach(() => {
    process.env.NEXT_BREVO_API_KEY = "test-brevo-api-key";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.NEXT_BREVO_API_KEY = originalApiKey;
  });

  it("sends verification OTP via Brevo API endpoint with correct headers", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ messageId: "<msg-12345@smtp.brevo.com>" }),
    });
    globalThis.fetch = mockFetch;

    const adapter = new BrevoEmailAdapter();
    const result = await adapter.sendVerificationOtp({
      email: "nouveau.client@example.com",
      name: "Jean Valjean",
      otp: "654321",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("<msg-12345@smtp.brevo.com>");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(options.method).toBe("POST");
    expect(options.headers["api-key"]).toBe("test-brevo-api-key");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.to).toEqual([{ email: "nouveau.client@example.com", name: "Jean Valjean" }]);
    expect(body.htmlContent).toContain("654321");
    expect(body.subject).toContain("654321");
  });

  it("handles Brevo API HTTP errors cleanly without crashing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ message: "Invalid email format" }),
    });
    globalThis.fetch = mockFetch;

    const adapter = new BrevoEmailAdapter();
    const result = await adapter.sendPasswordReset({
      email: "invalid-email",
      resetCode: "112233",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid email format");
  });
});
