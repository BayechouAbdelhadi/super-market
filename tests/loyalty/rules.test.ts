import { describe, it, expect } from "vitest";
import {
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
} from "@/lib/loyalty/domain";

describe("Règles métier de fidélité (§ 20)", () => {
  describe("Calcul des points fidélité (1 € = 1 point)", () => {
    it("attribue 1 point pour 1,00 €", () => {
      expect(calculatePoints(1.0)).toBe(1);
    });

    it("attribue 12 points pour 12,50 €", () => {
      expect(calculatePoints(12.5)).toBe(12);
    });

    it("attribue 45 points pour 45,80 €", () => {
      expect(calculatePoints(45.8)).toBe(45);
    });

    it("attribue 99 points pour 99,99 €", () => {
      expect(calculatePoints(99.99)).toBe(99);
    });

    it("attribue 100 points pour 100,00 €", () => {
      expect(calculatePoints(100.0)).toBe(100);
    });

    it("attribue 0 point pour un montant inférieur à 1 € ou négatif", () => {
      expect(calculatePoints(0.85)).toBe(0);
      expect(calculatePoints(-10)).toBe(0);
    });
  });

  describe("Calcul des statuts / paliers", () => {
    it("499 points historiques → BRONZE", () => {
      expect(calculateTier(499)).toBe("BRONZE");
    });

    it("500 points historiques → SILVER", () => {
      expect(calculateTier(500)).toBe("SILVER");
    });

    it("1 999 points historiques → SILVER", () => {
      expect(calculateTier(1999)).toBe("SILVER");
    });

    it("2 000 points historiques → GOLD", () => {
      expect(calculateTier(2000)).toBe("GOLD");
    });

    it("4 999 points historiques → GOLD", () => {
      expect(calculateTier(4999)).toBe("GOLD");
    });

    it("5 000 points historiques → VIP", () => {
      expect(calculateTier(5000)).toBe("VIP");
    });
  });

  describe("Déduction des points et contrôle du solde disponible", () => {
    it("autorise une déduction inférieure ou égale au solde disponible (100 - 50 = 50)", () => {
      expect(canRedeemPoints(100, 50)).toBe(true);
      const result = applyRedeemPoints(100, 500, 50);
      expect(result.available_points).toBe(50);
      expect(result.historical_points).toBe(500);
      expect(result.tier).toBe("SILVER");
    });

    it("refuse une déduction supérieure au solde disponible (100 disponibles - 150 demandés = refusé)", () => {
      expect(canRedeemPoints(100, 150)).toBe(false);
      expect(() => applyRedeemPoints(100, 500, 150)).toThrow("Opération refusée : solde disponible insuffisant");
    });

    it("garantit qu'un client GOLD reste GOLD après utilisation de ses points (immutabilité du statut)", () => {
      // Client avec 2 450 points historiques et 750 points disponibles
      const initialTier = calculateTier(2450);
      expect(initialTier).toBe("GOLD");

      // Déduction de 500 points
      const result = applyRedeemPoints(750, 2450, 500);

      // Solde disponible réduit à 250
      expect(result.available_points).toBe(250);
      // Points historiques restent 2450
      expect(result.historical_points).toBe(2450);
      // Statut reste toujours GOLD !
      expect(result.tier).toBe("GOLD");
    });
  });

  describe("Calcul lors d'un achat", () => {
    it("calcule correctement les points gagnés et le passage de palier", () => {
      const initialAvailable = 450;
      const initialHistorical = 450;
      const pointsEarned = calculatePoints(60.0); // 60 pts
      
      const updated = applyPurchasePoints(initialAvailable, initialHistorical, pointsEarned);
      expect(updated.available_points).toBe(510);
      expect(updated.historical_points).toBe(510);
      expect(updated.tier).toBe("SILVER"); // Passed from BRONZE to SILVER
    });
  });
});
