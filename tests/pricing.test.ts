import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateCartTotals,
  resolveCasePrice,
  shippingCentsForMethod,
  taxRateForState,
} from "../lib/pricing";

const tiers = [
  { min_cases: 1, price_per_case_cents: 1000 },
  { min_cases: 5, price_per_case_cents: 900 },
  { min_cases: 12, price_per_case_cents: 800 },
];

describe("resolveCasePrice", () => {
  it("uses the lowest tier for individual accounts at any volume", () => {
    assert.equal(resolveCasePrice(tiers, 20, "individual"), 1000);
  });

  it("unlocks business volume tiers at the min_cases boundary", () => {
    assert.equal(resolveCasePrice(tiers, 4, "business"), 1000);
    assert.equal(resolveCasePrice(tiers, 5, "business"), 900);
    assert.equal(resolveCasePrice(tiers, 12, "business"), 800);
  });

  it("returns 0 for empty tiers or invalid case counts", () => {
    assert.equal(resolveCasePrice([], 1, "business"), 0);
    assert.equal(resolveCasePrice(tiers, 0, "business"), 0);
  });
});

describe("tax and shipping", () => {
  it("skips tax when the account is tax-exempt", () => {
    assert.equal(taxRateForState("CA", true), 0);
    const totals = calculateCartTotals({
      lineSubtotalsCents: [10000],
      deliveryMethodId: "standard",
      shippingState: "CA",
      taxExempt: true,
    });
    assert.equal(totals.tax_cents, 0);
  });

  it("applies the CA rate to taxable accounts", () => {
    assert.equal(taxRateForState("CA", false), 7.25);
    const totals = calculateCartTotals({
      lineSubtotalsCents: [10000],
      deliveryMethodId: "pickup",
      shippingState: "CA",
      taxExempt: false,
    });
    assert.equal(totals.tax_cents, 725);
    assert.equal(totals.shipping_cents, 0);
  });

  it("uses supplied tax_rules rates instead of the fallback map", () => {
    const taxRules = { OR: 0, NV: 6.85 };
    assert.equal(taxRateForState("NV", false, taxRules), 6.85);
    assert.equal(taxRateForState("CA", false, taxRules), 0);
    const totals = calculateCartTotals({
      lineSubtotalsCents: [10000],
      deliveryMethodId: "pickup",
      shippingState: "NV",
      taxExempt: false,
      taxRules,
    });
    assert.equal(totals.tax_cents, 685);
  });

  it("gives free standard shipping over the configured threshold", () => {
    assert.equal(shippingCentsForMethod("standard", 25_000), 0);
    assert.equal(shippingCentsForMethod("standard", 24_999), 1499);
  });
});
