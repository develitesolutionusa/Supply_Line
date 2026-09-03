import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { didCrossLowStockThreshold } from "../lib/inventory/alerts";

describe("low-stock threshold breach", () => {
  it("fires only when quantity crosses from above the threshold to at or below it", () => {
    assert.equal(didCrossLowStockThreshold(12, 5, 5), true);
    assert.equal(didCrossLowStockThreshold(5, 4, 5), false);
    assert.equal(didCrossLowStockThreshold(20, 18, 5), false);
    assert.equal(didCrossLowStockThreshold(3, 2, 5), false);
  });
});
