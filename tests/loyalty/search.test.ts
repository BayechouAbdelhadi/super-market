import { describe, it, expect, beforeEach } from "vitest";
import { searchCustomers, normalizePhone } from "@/lib/loyalty/service";
import { loyaltyStore } from "@/lib/loyalty/store";

describe("Workflow de recherche client à champ unique (§ 19)", () => {
  beforeEach(() => {
    loyaltyStore.reset();
  });

  it("normalise correctement les numéros de téléphone", () => {
    expect(normalizePhone("06 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("06.12.34.56.78")).toBe("0612345678");
    expect(normalizePhone("06-12-34-56-78")).toBe("0612345678");
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("  06 12 34 56 78  ")).toBe("0612345678");
  });

  it("retrouve les clients dont le prénom ou nom contient 'Ahmed' (plusieurs résultats)", () => {
    const results = searchCustomers("Ahmed");
    expect(results.length).toBeGreaterThanOrEqual(2);
    const names = results.map((c) => c.full_name);
    expect(names).toContain("Ahmed Bayechou");
    expect(names).toContain("Ahmed Benali");
  });

  it("retrouve le client avec 'Bayechou'", () => {
    const results = searchCustomers("Bayechou");
    expect(results.length).toBe(1);
    expect(results[0].full_name).toBe("Ahmed Bayechou");
  });

  it("retrouve le client par 'Prénom Nom' : 'Ahmed Bayechou'", () => {
    const results = searchCustomers("Ahmed Bayechou");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("cust-1");
    expect(results[0].full_name).toBe("Ahmed Bayechou");
  });

  it("retrouve le client par 'Nom Prénom' : 'Bayechou Ahmed'", () => {
    const results = searchCustomers("Bayechou Ahmed");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("cust-1");
    expect(results[0].full_name).toBe("Ahmed Bayechou");
  });

  it("retrouve le client par email 'ahmed@gmail.com'", () => {
    const results = searchCustomers("ahmed@gmail.com");
    expect(results.length).toBe(1);
    expect(results[0].email).toBe("ahmed@gmail.com");
  });

  it("retrouve le client par email en majuscules 'AHMED@GMAIL.COM' (insensible à la casse)", () => {
    const results = searchCustomers("AHMED@GMAIL.COM");
    expect(results.length).toBe(1);
    expect(results[0].email).toBe("ahmed@gmail.com");
  });

  it("retrouve le client par téléphone compact '0612345678'", () => {
    const results = searchCustomers("0612345678");
    expect(results.length).toBe(1);
    expect(results[0].phone_normalized).toBe("0612345678");
  });

  it("retrouve le client par téléphone avec espaces '06 12 34 56 78'", () => {
    const results = searchCustomers("06 12 34 56 78");
    expect(results.length).toBe(1);
    expect(results[0].phone_normalized).toBe("0612345678");
  });

  it("retrouve le client par téléphone avec points '06.12.34.56.78'", () => {
    const results = searchCustomers("06.12.34.56.78");
    expect(results.length).toBe(1);
    expect(results[0].phone_normalized).toBe("0612345678");
  });

  it("retrouve le client avec tolérance des espaces inutiles '  Ahmed  '", () => {
    const results = searchCustomers("  Ahmed  ");
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.map((c) => c.first_name)).toContain("Ahmed");
  });

  it("renvoie les informations enrichies de fidélité (statut, points disponibles et historiques)", () => {
    const results = searchCustomers("Bayechou");
    expect(results.length).toBe(1);
    const client = results[0];
    expect(client.tier).toBe("Gold");
    expect(client.historical_points).toBe(2450);
    expect(client.available_points).toBe(750);
  });
});
