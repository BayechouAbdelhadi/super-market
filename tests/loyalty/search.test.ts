import { describe, it, expect } from "vitest";
import { normalizePhone, matchCustomerQuery } from "@/lib/loyalty/domain";

describe("Workflow de recherche client à champ unique (§ 19)", () => {
  const sampleCustomer = {
    first_name: "Ahmed",
    last_name: "Bayechou",
    email: "ahmed@gmail.com",
    phone_number: "06 12 34 56 78",
  };

  const sampleCustomer2 = {
    first_name: "Ahmed",
    last_name: "Benali",
    email: "benali@gmail.com",
    phone_number: "06 99 88 77 66",
  };

  it("normalise correctement les numéros de téléphone", () => {
    expect(normalizePhone("06 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("06.12.34.56.78")).toBe("0612345678");
    expect(normalizePhone("06-12-34-56-78")).toBe("0612345678");
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("  06 12 34 56 78  ")).toBe("0612345678");
  });

  it("retrouve les clients dont le prénom contient 'Ahmed'", () => {
    expect(matchCustomerQuery(sampleCustomer, "Ahmed")).toBe(true);
    expect(matchCustomerQuery(sampleCustomer2, "Ahmed")).toBe(true);
  });

  it("retrouve le client avec 'Bayechou'", () => {
    expect(matchCustomerQuery(sampleCustomer, "Bayechou")).toBe(true);
    expect(matchCustomerQuery(sampleCustomer2, "Bayechou")).toBe(false);
  });

  it("retrouve le client par 'Prénom Nom' : 'Ahmed Bayechou'", () => {
    expect(matchCustomerQuery(sampleCustomer, "Ahmed Bayechou")).toBe(true);
  });

  it("retrouve le client par 'Nom Prénom' : 'Bayechou Ahmed'", () => {
    expect(matchCustomerQuery(sampleCustomer, "Bayechou Ahmed")).toBe(true);
  });

  it("retrouve le client par email 'ahmed@gmail.com'", () => {
    expect(matchCustomerQuery(sampleCustomer, "ahmed@gmail.com")).toBe(true);
  });

  it("retrouve le client par email en majuscules 'AHMED@GMAIL.COM' (insensible à la casse)", () => {
    expect(matchCustomerQuery(sampleCustomer, "AHMED@GMAIL.COM")).toBe(true);
  });

  it("retrouve le client par téléphone compact '0612345678'", () => {
    expect(matchCustomerQuery(sampleCustomer, "0612345678")).toBe(true);
  });

  it("retrouve le client par téléphone avec espaces '06 12 34 56 78'", () => {
    expect(matchCustomerQuery(sampleCustomer, "06 12 34 56 78")).toBe(true);
  });

  it("retrouve le client par téléphone avec points '06.12.34.56.78'", () => {
    expect(matchCustomerQuery(sampleCustomer, "06.12.34.56.78")).toBe(true);
  });

  it("retrouve le client avec tolérance des espaces inutiles '  Ahmed  '", () => {
    expect(matchCustomerQuery(sampleCustomer, "  Ahmed  ")).toBe(true);
  });
});
