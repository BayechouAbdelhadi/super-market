import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSignedToken, verifyActivationToken, type AccountActivationPayload } from "@/lib/email/otp-security";

const NOW = 1_800_000_000_000;

function token(overrides: Omit<Partial<AccountActivationPayload>, "type"> & { type?: string } = {}) {
  return createSignedToken({
    email: "client@example.com",
    role: "CUSTOMER",
    type: "ACCOUNT_ACTIVATION",
    expiresAt: NOW + 60_000,
    ...overrides,
  });
}

describe("verifyActivationToken", () => {
  beforeEach(() => vi.stubEnv("AUTH_TOKEN_SECRET", "test-auth-token-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a signed, unexpired activation token", () => {
    expect(verifyActivationToken(token(), NOW)?.email).toBe("client@example.com");
  });

  it("rejects an expired token", () => {
    expect(verifyActivationToken(token({ expiresAt: NOW - 1 }), NOW)).toBeNull();
  });

  it("rejects a token of another type", () => {
    expect(verifyActivationToken(token({ type: "PASSWORD_RESET" }), NOW)).toBeNull();
  });

  it("rejects a tampered token", () => {
    expect(verifyActivationToken(token() + "x", NOW)).toBeNull();
  });
});
