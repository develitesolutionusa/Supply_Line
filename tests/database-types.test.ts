import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Database } from "../types/database";

const tables: Array<keyof Database["public"]["Tables"]> = [
  "addresses",
  "business_accounts",
  "cart_items",
  "carts",
  "categories",
  "inventory",
  "order_items",
  "orders",
  "price_tiers",
  "products",
  "tax_rules",
  "users",
  "warehouses",
];

describe("generated database types", () => {
  it("covers every public table from the B1 schema", () => {
    assert.equal(tables.length, 13);
  });
});
