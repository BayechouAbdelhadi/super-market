import { describe, it, expect } from "vitest";
import {
  evaluatePasswordCriteria,
  PasswordSchema,
  PASSWORD_CRITERIA,
} from "@/lib/auth/password-rules";

describe("Password Rules & Criteria", () => {
  describe("evaluatePasswordCriteria", () => {
    it("reports incomplete for empty or short passwords", () => {
      const emptyResult = evaluatePasswordCriteria("");
      expect(emptyResult.isComplete).toBe(false);
      expect(emptyResult.metCount).toBe(0);

      const shortResult = evaluatePasswordCriteria("Ab1!");
      expect(shortResult.isComplete).toBe(false);
      expect(shortResult.results.find((r) => r.id === "minLength")?.satisfied).toBe(false);
      expect(shortResult.results.find((r) => r.id === "hasUppercase")?.satisfied).toBe(true);
      expect(shortResult.results.find((r) => r.id === "hasLowercase")?.satisfied).toBe(true);
      expect(shortResult.results.find((r) => r.id === "hasNumber")?.satisfied).toBe(true);
      expect(shortResult.results.find((r) => r.id === "hasSpecial")?.satisfied).toBe(true);
    });

    it("verifies uppercase letter requirement", () => {
      const noUpper = evaluatePasswordCriteria("password123!");
      expect(noUpper.results.find((r) => r.id === "hasUppercase")?.satisfied).toBe(false);
      expect(noUpper.isComplete).toBe(false);

      const withUpper = evaluatePasswordCriteria("Password123!");
      expect(withUpper.results.find((r) => r.id === "hasUppercase")?.satisfied).toBe(true);
    });

    it("verifies lowercase letter requirement", () => {
      const noLower = evaluatePasswordCriteria("PASSWORD123!");
      expect(noLower.results.find((r) => r.id === "hasLowercase")?.satisfied).toBe(false);
      expect(noLower.isComplete).toBe(false);

      const withLower = evaluatePasswordCriteria("Password123!");
      expect(withLower.results.find((r) => r.id === "hasLowercase")?.satisfied).toBe(true);
    });

    it("verifies number requirement", () => {
      const noNumber = evaluatePasswordCriteria("Password!@#");
      expect(noNumber.results.find((r) => r.id === "hasNumber")?.satisfied).toBe(false);
      expect(noNumber.isComplete).toBe(false);

      const withNumber = evaluatePasswordCriteria("Password123!");
      expect(withNumber.results.find((r) => r.id === "hasNumber")?.satisfied).toBe(true);
    });

    it("verifies special character requirement", () => {
      const noSpecial = evaluatePasswordCriteria("Password123");
      expect(noSpecial.results.find((r) => r.id === "hasSpecial")?.satisfied).toBe(false);
      expect(noSpecial.isComplete).toBe(false);

      const withSpecial = evaluatePasswordCriteria("Password123!");
      expect(withSpecial.results.find((r) => r.id === "hasSpecial")?.satisfied).toBe(true);
    });

    it("returns complete with all 5 criteria satisfied for strong passwords", () => {
      const strongPasswords = [
        "MonSuperMotDePasse123!",
        "Secure@2026",
        "Calais#Super8",
      ];

      for (const pwd of strongPasswords) {
        const result = evaluatePasswordCriteria(pwd);
        expect(result.isComplete).toBe(true);
        expect(result.metCount).toBe(5);
        expect(result.totalCount).toBe(5);
      }
    });
  });

  describe("PasswordSchema (Zod validation)", () => {
    it("accepts a password meeting all security criteria", () => {
      const result = PasswordSchema.safeParse("MonSuperPass2026!");
      expect(result.success).toBe(true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = PasswordSchema.safeParse("Ab1!xyz");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("au moins 8 caractères");
      }
    });

    it("rejects passwords missing an uppercase letter", () => {
      const result = PasswordSchema.safeParse("monmotdepasse123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("lettre majuscule");
      }
    });

    it("rejects passwords missing a lowercase letter", () => {
      const result = PasswordSchema.safeParse("MONMOTDEPASSE123!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("lettre minuscule");
      }
    });

    it("rejects passwords missing a number", () => {
      const result = PasswordSchema.safeParse("MonMotDePasse!");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("chiffre");
      }
    });

    it("rejects passwords missing a special character", () => {
      const result = PasswordSchema.safeParse("MonMotDePasse123");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain("caractère spécial");
      }
    });
  });
});
