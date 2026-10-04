import { describe, it, expect, beforeEach } from "vitest";
import {
  calculatePoints,
  calculateTier,
  createCustomer,
  getCustomerDetail,
  recordPurchase,
  redeemPoints,
} from "@/lib/loyalty/service";
import { loyaltyStore } from "@/lib/loyalty/store";

describe("Règles métier de fidélité (§ 20)", () => {
  beforeEach(() => {
    loyaltyStore.reset();
  });

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
    it("499 points historiques → Bronze", () => {
      expect(calculateTier(499)).toBe("Bronze");
    });

    it("500 points historiques → Silver", () => {
      expect(calculateTier(500)).toBe("Silver");
    });

    it("1 999 points historiques → Silver", () => {
      expect(calculateTier(1999)).toBe("Silver");
    });

    it("2 000 points historiques → Gold", () => {
      expect(calculateTier(2000)).toBe("Gold");
    });

    it("4 999 points historiques → Gold", () => {
      expect(calculateTier(4999)).toBe("Gold");
    });

    it("5 000 points historiques → VIP", () => {
      expect(calculateTier(5000)).toBe("VIP");
    });
  });

  describe("Déduction des points et contrôle du solde disponible", () => {
    it("autorise une déduction inférieure ou égale au solde disponible (100 - 50 = 50)", () => {
      // Création d'un client avec 100 points
      const createRes = createCustomer(
        {
          first_name: "Jean",
          last_name: "Dupont",
          email: "jean.dupont@test.fr",
          phone: "06 00 11 22 33",
        },
        "cashier-1",
      );
      expect(createRes.success).toBe(true);
      if (!createRes.success) return;

      const custId = createRes.customer.id;

      // Achat de 100 € -> 100 points
      recordPurchase(custId, 100.0, "cashier-1");

      const beforeRedeem = getCustomerDetail(custId)!;
      expect(beforeRedeem.available_points).toBe(100);

      // Déduction de 50 points
      const redeemRes = redeemPoints(custId, 50, "cashier-1");
      expect(redeemRes.success).toBe(true);
      if (!redeemRes.success) return;

      expect(redeemRes.customer.available_points).toBe(50);
      expect(redeemRes.movement.type).toBe("REDEEM");
      expect(redeemRes.movement.amount).toBe(50);
      expect(redeemRes.movement.created_by).toBe("cashier-1");
    });

    it("refuse une déduction supérieure au solde disponible (100 disponibles - 150 demandés = refusé)", () => {
      const createRes = createCustomer(
        {
          first_name: "Claire",
          last_name: "Martin",
          email: "claire.martin@test.fr",
          phone: "06 44 55 66 77",
        },
        "cashier-1",
      );
      expect(createRes.success).toBe(true);
      if (!createRes.success) return;

      const custId = createRes.customer.id;
      recordPurchase(custId, 100.0, "cashier-1");

      // Tentative d'utilisation de 150 points sur 100 disponibles
      const redeemRes = redeemPoints(custId, 150, "cashier-1");
      expect(redeemRes.success).toBe(false);
      if (!redeemRes.success) {
        expect(redeemRes.error).toContain("Opération refusée : solde disponible insuffisant");
      }

      // Vérifier que le solde est resté intact
      const afterFail = getCustomerDetail(custId)!;
      expect(afterFail.available_points).toBe(100);
    });

    it("garantit qu'un client Gold reste Gold après utilisation de ses points (immutabilité du statut)", () => {
      // Ahmed Bayechou est Gold avec 2 450 points historiques et 750 points disponibles
      const customer = getCustomerDetail("cust-1")!;
      expect(customer.tier).toBe("Gold");
      expect(customer.historical_points).toBe(2450);
      expect(customer.available_points).toBe(750);

      // Déduction de 500 points
      const redeemRes = redeemPoints("cust-1", 500, "cashier-1");
      expect(redeemRes.success).toBe(true);
      if (!redeemRes.success) return;

      // Solde disponible réduit à 250
      expect(redeemRes.customer.available_points).toBe(250);
      // Points historiques restent 2450
      expect(redeemRes.customer.historical_points).toBe(2450);
      // Statut reste toujours Gold !
      expect(redeemRes.customer.tier).toBe("Gold");
    });
  });

  describe("Création d'un client et détection des doublons", () => {
    it("détecte un doublon de numéro de téléphone", () => {
      const result = createCustomer(
        {
          first_name: "Nouveau",
          last_name: "Client",
          email: "nouveau@email.com",
          phone: "06 12 34 56 78", // Numéro déjà utilisé par Ahmed Bayechou
        },
        "cashier-1",
      );

      expect(result.success).toBe(false);
      if (!result.success && result.isDuplicate) {
        expect(result.isDuplicate).toBe(true);
        expect(result.field).toBe("phone");
        expect(result.message).toContain("Un client utilisant ce numéro de téléphone existe déjà");
        expect(result.existingCustomer.full_name).toBe("Ahmed Bayechou");
      }
    });

    it("détecte un doublon d'adresse email", () => {
      const result = createCustomer(
        {
          first_name: "Autre",
          last_name: "Client",
          email: "ahmed@gmail.com", // Email déjà utilisé par Ahmed Bayechou
          phone: "06 77 88 99 00",
        },
        "cashier-1",
      );

      expect(result.success).toBe(false);
      if (!result.success && result.isDuplicate) {
        expect(result.isDuplicate).toBe(true);
        expect(result.field).toBe("email");
        expect(result.message).toContain("Un client utilisant cette adresse email existe déjà");
        expect(result.existingCustomer.full_name).toBe("Ahmed Bayechou");
      }
    });
  });

  describe("Enregistrement d'achats et traçabilité caissier", () => {
    it("enregistre un achat, conserve les centimes, attribue les points et trace created_by", () => {
      const result = recordPurchase("cust-1", 45.8, "cashier-1");
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.purchase.amount).toBe(45.8);
      expect(result.purchase.points_earned).toBe(45);
      expect(result.purchase.created_by).toBe("cashier-1");
      expect(result.movement.created_by).toBe("cashier-1");

      // Vérifier augmentation des points
      expect(result.customer.historical_points).toBe(2450 + 45);
      expect(result.customer.available_points).toBe(750 + 45);
    });
  });
});
