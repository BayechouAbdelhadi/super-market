import { describe, it, expect } from "vitest";
import {
  calculatePoints,
  calculateTier,
  canRedeemPoints,
  applyPurchasePoints,
  applyRedeemPoints,
  calculateRedemptionPointsEarned,
  calculateMaxPointsForAmount,
  calculateMaxRedeemablePoints,
  validateRedemption,
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

    it("ne crédite JAMAIS de points lors d'une utilisation (consommation du solde), même avec montant d'achat > 0", () => {
      // Règle métier : le client consomme, il ne gagne aucun point lors d'une remise
      expect(calculateRedemptionPointsEarned(0)).toBe(0);
      expect(calculateRedemptionPointsEarned(15.5)).toBe(0);
      expect(calculateRedemptionPointsEarned(120.0)).toBe(0);

      const result = applyRedeemPoints(200, 1000, 50);
      expect(result.points_earned).toBe(0);
      expect(result.available_points).toBe(150);
      expect(result.historical_points).toBe(1000);
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

  describe("Application des règles dynamiques issues des configurations admin", () => {
    it("applique un ratio euroToPointsRatio configuré par l'admin (ex: 2 pts ou 1.5 pt par euro)", () => {
      expect(calculatePoints(50, 2)).toBe(100);
      expect(calculatePoints(12.5, 0.5)).toBe(6);
      expect(calculatePoints(30, 3)).toBe(90);
      // Ratio fractionnaire (ex: 1.5 pt / €)
      expect(calculatePoints(1, 1.5)).toBe(2);
      expect(calculatePoints(2, 1.5)).toBe(3);
      expect(calculatePoints(10, 1.5)).toBe(15);
    });

    it("applique des seuils de paliers personnalisés", () => {
      const customTiers = { silver: 300, gold: 1000, vip: 2500 };
      expect(calculateTier(250, customTiers)).toBe("BRONZE");
      expect(calculateTier(300, customTiers)).toBe("SILVER");
      expect(calculateTier(999, customTiers)).toBe("SILVER");
      expect(calculateTier(1000, customTiers)).toBe("GOLD");
      expect(calculateTier(2500, customTiers)).toBe("VIP");
    });

    it("valide la règle du minimum de points requis pour une remise (minPointsToRedeem)", () => {
      const rules = {
        minPointsToRedeem: 50,
        maxDiscountPerTransactionEuro: 50.0,
        pointValueInEuro: 0.05,
      };

      // Tente d'utiliser 40 points avec un minimum de 50
      expect(() => {
        applyRedeemPoints(100, 500, 40, undefined, rules);
      }).toThrow("Seuil minimum non atteint : un minimum de 50 points est requis pour utiliser une remise.");
    });

    it("valide la règle du plafond de remise par ticket (maxDiscountPerTransactionEuro)", () => {
      const rules = {
        minPointsToRedeem: 50,
        maxDiscountPerTransactionEuro: 20.0, // 20 € max = 400 points max à 0.05 €/pt
        pointValueInEuro: 0.05,
      };

      // Tente d'utiliser 500 points (25 € de remise > plafond 20 €)
      expect(() => {
        applyRedeemPoints(1000, 2000, 500, undefined, rules);
      }).toThrow("La remise maximale autorisée par passage en caisse est de 20.00 €");

      // Utilise 400 points (20 € de remise <= 20 €) -> Autorisé
      const ok = applyRedeemPoints(1000, 2000, 400, undefined, rules);
      expect(ok.available_points).toBe(600);
    });
  });

  describe("Règle métier : Aucun rendu de monnaie (amount - points * pointValue >= 0)", () => {
    it("calcule correctement le plafond de points utilisables en fonction du montant d'achat (calculateMaxPointsForAmount)", () => {
      // 10.00 € à 0.05 €/pt -> 200 points max (10.00 - 200 * 0.05 = 0.00 €)
      expect(calculateMaxPointsForAmount(10.0, 0.05)).toBe(200);

      // 15.00 € à 0.05 €/pt -> 300 points max
      expect(calculateMaxPointsForAmount(15.0, 0.05)).toBe(300);

      // Montant non multiple exact : 12.49 € à 0.05 €/pt -> 249 points (12.45 € <= 12.49 €)
      expect(calculateMaxPointsForAmount(12.49, 0.05)).toBe(249);
      expect(12.49 - 249 * 0.05).toBeGreaterThanOrEqual(0);

      // Précision flottante (0.15 € à 0.05 €/pt) -> exactement 3 points
      expect(calculateMaxPointsForAmount(0.15, 0.05)).toBe(3);

      // Montant 0 ou négatif -> 0 point utilisable
      expect(calculateMaxPointsForAmount(0, 0.05)).toBe(0);
      expect(calculateMaxPointsForAmount(-5, 0.05)).toBe(0);
    });

    it("calcule les points effectifs maximums en combinant le solde client, le montant et le plafond (calculateMaxRedeemablePoints)", () => {
      // Client a 500 points, mais l'achat est de 10 € (max 200 pts autorisés) -> 200 points
      expect(calculateMaxRedeemablePoints(500, 10.0, { pointValueInEuro: 0.05 })).toBe(200);

      // Client a 150 points et l'achat est de 20 € (max 400 pts autorisés) -> 150 points (limité par son solde)
      expect(calculateMaxRedeemablePoints(150, 20.0, { pointValueInEuro: 0.05 })).toBe(150);

      // Client a 1000 points, achat de 50 € (max 1000 pts), mais plafond magasin de 20 € (max 400 pts) -> 400 points
      expect(
        calculateMaxRedeemablePoints(1000, 50.0, {
          pointValueInEuro: 0.05,
          maxDiscountPerTransactionEuro: 20.0,
        })
      ).toBe(400);

      // Achat de 0 € -> 0 point utilisable (aucun rendu d'argent)
      expect(calculateMaxRedeemablePoints(500, 0, { pointValueInEuro: 0.05 })).toBe(0);
    });

    it("valide une déduction où la remise est strictement inférieure ou égale au montant d'achat", () => {
      // 10 € d'achat, déduction de 200 points (10.00 € de remise) -> valide
      const validationExact = validateRedemption(200, 500, { pointValueInEuro: 0.05 }, 10.0);
      expect(validationExact.valid).toBe(true);

      // 15 € d'achat, déduction de 100 points (5.00 € de remise) -> valide
      const validationPartial = validateRedemption(100, 500, { pointValueInEuro: 0.05 }, 15.0);
      expect(validationPartial.valid).toBe(true);

      const res = applyRedeemPoints(500, 1000, 200, undefined, { pointValueInEuro: 0.05 }, 10.0);
      expect(res.available_points).toBe(300);
    });

    it("rejette une déduction où la remise dépasse le montant d'achat (pas de rendu d'argent)", () => {
      // 10 € d'achat, tentative d'utiliser 250 points (12.50 € de remise > 10.00 €)
      const validation = validateRedemption(250, 500, { pointValueInEuro: 0.05 }, 10.0);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("La remise ne peut pas dépasser le montant de l'achat");
      expect(validation.error).toContain("aucun rendu de monnaie autorisé");

      // applyRedeemPoints doit lever une erreur
      expect(() => {
        applyRedeemPoints(500, 1000, 250, undefined, { pointValueInEuro: 0.05 }, 10.0);
      }).toThrow("La remise ne peut pas dépasser le montant de l'achat");
    });

    it("rejette toute utilisation de points si le montant de l'achat est 0 €", () => {
      const validation = validateRedemption(50, 500, { pointValueInEuro: 0.05 }, 0);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("La remise ne peut pas dépasser le montant de l'achat");

      expect(() => {
        applyRedeemPoints(500, 1000, 50, undefined, { pointValueInEuro: 0.05 }, 0);
      }).toThrow("La remise ne peut pas dépasser le montant de l'achat");
    });
  });
});
