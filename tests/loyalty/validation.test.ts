import { describe, it, expect } from "vitest";
import {
  CreateCustomerSchema,
  RecordPurchaseSchema,
  RedeemPointsSchema,
} from "@/lib/loyalty/validation";

describe("Loyalty Input Validation Schemas", () => {
  describe("CreateCustomerSchema", () => {
    it("valide un client avec toutes les données requises", () => {
      const result = CreateCustomerSchema.safeParse({
        first_name: "Ahmed",
        last_name: "Bayechou",
        email: "ahmed@example.com",
        phone: "0612345678",
      });
      expect(result.success).toBe(true);
    });

    it("rejette les prénoms ou noms trop courts", () => {
      const result = CreateCustomerSchema.safeParse({
        first_name: "A",
        last_name: "B",
        email: "valid@email.com",
        phone: "0612345678",
      });
      expect(result.success).toBe(false);
    });

    it("rejette un email invalide", () => {
      const result = CreateCustomerSchema.safeParse({
        first_name: "Ahmed",
        last_name: "Bayechou",
        email: "not-an-email",
        phone: "0612345678",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("RecordPurchaseSchema", () => {
    it("valide un montant d'achat strictement positif", () => {
      const result = RecordPurchaseSchema.safeParse({ amount: 45.5 });
      expect(result.success).toBe(true);
    });

    it("rejette un montant d'achat inférieur ou égal à 0", () => {
      expect(RecordPurchaseSchema.safeParse({ amount: 0 }).success).toBe(false);
      expect(RecordPurchaseSchema.safeParse({ amount: -10 }).success).toBe(false);
    });
  });

  describe("RedeemPointsSchema", () => {
    it("valide des points positifs et un montant >= 0", () => {
      const result = RedeemPointsSchema.safeParse({
        points: 50,
        amount: 25.0,
        reason: "Remise caisse",
      });
      expect(result.success).toBe(true);
    });

    it("autorise un montant égal à 0 (achat 100% remisé)", () => {
      const result = RedeemPointsSchema.safeParse({
        points: 100,
        amount: 0,
      });
      expect(result.success).toBe(true);
    });

    it("rejette des points décimaux ou négatifs", () => {
      expect(RedeemPointsSchema.safeParse({ points: 12.5, amount: 0 }).success).toBe(false);
      expect(RedeemPointsSchema.safeParse({ points: -5, amount: 0 }).success).toBe(false);
    });

    it("rejette un montant d'achat négatif", () => {
      expect(RedeemPointsSchema.safeParse({ points: 50, amount: -10 }).success).toBe(false);
    });
  });
});
