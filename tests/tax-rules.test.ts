import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { taxRulesFromRows } from "../lib/tax/rules";

describe("tax_rules mapping", () => {
  it("normalizes state codes and numeric rates from the table", () => {
    const rules = taxRulesFromRows([
      { state_code: "ca", rate_percent: 7.25 },
      { state_code: " ny ", rate_percent: 8 },
      { state_code: "", rate_percent: 99 },
    ]);
    assert.equal(rules.CA, 7.25);
    assert.equal(rules.NY, 8);
    assert.equal(rules[""], undefined);
  });
});
