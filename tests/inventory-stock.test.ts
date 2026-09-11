import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertCartHasStock, cartLineStockError } from "../lib/inventory/stock";

describe("cart stock at checkout", () => {
  it("allows a line when enough cases are on hand", () => {
    assert.equal(
      cartLineStockError({
        sku: "NAP-001",
        cases: 4,
        quantity_on_hand: 12,
        stock_status: "in_stock",
      }),
      null,
    );
    assert.doesNotThrow(() =>
      assertCartHasStock([
        { sku: "NAP-001", cases: 4, quantity_on_hand: 12, stock_status: "in_stock" },
      ]),
    );
  });

  it("rejects out-of-stock and oversold lines", () => {
    assert.match(
      cartLineStockError({
        sku: "CUP-010",
        cases: 2,
        quantity_on_hand: 0,
        stock_status: "out_of_stock",
      }) ?? "",
      /CUP-010 is out of stock/,
    );
    assert.match(
      cartLineStockError({
        sku: "BAG-003",
        cases: 8,
        quantity_on_hand: 3,
        stock_status: "low_stock",
      }) ?? "",
      /only 3 cases available/,
    );
    assert.throws(
      () =>
        assertCartHasStock([
          { sku: "BAG-003", cases: 8, quantity_on_hand: 3, stock_status: "low_stock" },
        ]),
      /BAG-003/,
    );
  });
});
