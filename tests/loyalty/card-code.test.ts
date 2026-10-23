import { describe, it, expect } from "vitest";
import { encodeLoyaltyCardCode, parseLoyaltyCardCode } from "@/lib/loyalty/card-code";

const ID = "3f2b6c1e-8a4d-4c2b-9e7f-1a2b3c4d5e6f";

describe("loyalty card code", () => {
  it("round-trips a customer id", () => {
    expect(parseLoyaltyCardCode(encodeLoyaltyCardCode(ID))).toBe(ID);
  });

  it("ignores surrounding whitespace", () => {
    expect(parseLoyaltyCardCode(`  ${encodeLoyaltyCardCode(ID)}\n`)).toBe(ID);
  });

  it("rejects codes that are not loyalty cards", () => {
    expect(parseLoyaltyCardCode(ID)).toBeNull();
    expect(parseLoyaltyCardCode("https://example.com")).toBeNull();
    expect(parseLoyaltyCardCode(encodeLoyaltyCardCode("not-a-uuid"))).toBeNull();
  });
});
