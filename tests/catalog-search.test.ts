import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { productSearchFilter } from "../lib/catalog/search";
import { pageBounds } from "../lib/pagination";

describe("productSearchFilter", () => {
  it("builds a name and sku filter and strips wildcards", () => {
    assert.equal(productSearchFilter("  cups  "), "name.ilike.%cups%,sku.ilike.cups%");
    assert.equal(productSearchFilter("bev%_(x)"), "name.ilike.%bevx%,sku.ilike.bevx%");
    assert.equal(productSearchFilter("   "), null);
    assert.equal(productSearchFilter("%_,()"), null);
  });
});

describe("pageBounds", () => {
  it("clamps page and limit and computes a slice start", () => {
    assert.deepEqual(pageBounds(0, 12, 30), { page: 1, limit: 12, total_pages: 3, start: 0 });
    assert.deepEqual(pageBounds(2, 12, 30), { page: 2, limit: 12, total_pages: 3, start: 12 });
    assert.deepEqual(pageBounds(1, 200, 10), { page: 1, limit: 48, total_pages: 1, start: 0 });
    assert.deepEqual(pageBounds(1, 20, 0, 50), { page: 1, limit: 20, total_pages: 1, start: 0 });
  });
});
