import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setPasswordFromToken, PasswordServiceDeps } from "@/lib/auth/password-service";
import { createActivationLink, createPasswordResetToken } from "@/lib/auth/links";
import { createSignedToken } from "@/lib/email/otp-security";
import { IUserAccountRepository, ITokenUseRepository } from "@/lib/auth/ports";

class FakeAccounts implements IUserAccountRepository {
  passwords = new Map<string, string>();
  failUpdate = false;
  constructor(private users: Record<string, string>) {}
  async findProfileByEmail() {
    return null;
  }
  async findConflict() {
    return null;
  }
  async createAccount() {
    return { ok: true as const, id: "new-user" };
  }
  async findUserIdByEmail(email: string) {
    return this.users[email] ?? null;
  }
  async setPassword(userId: string, password: string) {
    if (this.failUpdate) return { error: "weak password" };
    this.passwords.set(userId, password);
    return {};
  }
}

class FakeTokenUses implements ITokenUseRepository {
  used = new Set<string>();
  async consume(jti: string) {
    if (this.used.has(jti)) return false;
    this.used.add(jti);
    return true;
  }
  async release(jti: string) {
    this.used.delete(jti);
  }
}

function tokenFromLink(link: string): string {
  return decodeURIComponent(new URL(link).searchParams.get("token") || "");
}

describe("setPasswordFromToken", () => {
  let deps: PasswordServiceDeps & { accounts: FakeAccounts; tokenUses: FakeTokenUses };

  beforeEach(() => {
    vi.stubEnv("AUTH_TOKEN_SECRET", "test-auth-token-secret");
    deps = { accounts: new FakeAccounts({ "client@example.com": "user-1" }), tokenUses: new FakeTokenUses() };
  });
  afterEach(() => vi.unstubAllEnvs());

  it("sets the password once, then rejects the same reset link", async () => {
    const token = createPasswordResetToken("client@example.com");

    const first = await setPasswordFromToken({ flow: "PASSWORD_RESET", token, password: "N3w!Password" }, deps);
    expect(first).toEqual({ ok: true, email: "client@example.com", role: undefined });
    expect(deps.accounts.passwords.get("user-1")).toBe("N3w!Password");

    const replay = await setPasswordFromToken({ flow: "PASSWORD_RESET", token, password: "Other!Pass1" }, deps);
    expect(replay).toEqual({ ok: false, reason: "ALREADY_USED" });
    expect(deps.accounts.passwords.get("user-1")).toBe("N3w!Password");
  });

  it("frees the link again when the password update fails", async () => {
    const token = createPasswordResetToken("client@example.com");
    deps.accounts.failUpdate = true;
    const failed = await setPasswordFromToken({ flow: "PASSWORD_RESET", token, password: "x" }, deps);
    expect(failed).toMatchObject({ ok: false, reason: "UPDATE_FAILED" });

    deps.accounts.failUpdate = false;
    const retry = await setPasswordFromToken({ flow: "PASSWORD_RESET", token, password: "N3w!Password" }, deps);
    expect(retry.ok).toBe(true);
  });

  it("does not accept an activation link in the reset flow, nor the reverse", async () => {
    const activation = tokenFromLink(createActivationLink("https://shop.test", "client@example.com", "CUSTOMER"));
    const reset = createPasswordResetToken("client@example.com");

    expect(await setPasswordFromToken({ flow: "PASSWORD_RESET", token: activation, password: "p" }, deps)).toEqual({
      ok: false,
      reason: "INVALID_TOKEN",
    });
    expect(await setPasswordFromToken({ flow: "ACCOUNT_ACTIVATION", token: reset, password: "p" }, deps)).toEqual({
      ok: false,
      reason: "INVALID_TOKEN",
    });
  });

  it("returns the role of an activation link", async () => {
    const token = tokenFromLink(createActivationLink("https://shop.test", "client@example.com", "CASHIER"));
    const result = await setPasswordFromToken({ flow: "ACCOUNT_ACTIVATION", token, password: "N3w!Password" }, deps);
    expect(result).toEqual({ ok: true, email: "client@example.com", role: "CASHIER" });
  });

  it("reports expired links and unknown accounts", async () => {
    const expired = createSignedToken({ email: "client@example.com", type: "PASSWORD_RESET", jti: "j1", expiresAt: 1 });
    expect(await setPasswordFromToken({ flow: "PASSWORD_RESET", token: expired, password: "p" }, deps)).toEqual({
      ok: false,
      reason: "EXPIRED",
    });

    const unknown = createPasswordResetToken("nobody@example.com");
    expect(await setPasswordFromToken({ flow: "PASSWORD_RESET", token: unknown, password: "p" }, deps)).toEqual({
      ok: false,
      reason: "ACCOUNT_NOT_FOUND",
      email: "nobody@example.com",
    });
  });

  it("still accepts links issued before single-use ids (no jti) until they expire", async () => {
    const legacy = createSignedToken({ email: "client@example.com", expiresAt: Date.now() + 60_000 });
    const result = await setPasswordFromToken({ flow: "PASSWORD_RESET", token: legacy, password: "N3w!Password" }, deps);
    expect(result.ok).toBe(true);
  });
});
