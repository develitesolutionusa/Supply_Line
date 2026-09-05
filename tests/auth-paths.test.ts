import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isProtectedApiPath, isProtectedPath } from "../lib/auth/paths";

describe("auth path protection", () => {
  it("protects storefront account, checkout, and admin pages", () => {
    assert.equal(isProtectedPath("/checkout"), true);
    assert.equal(isProtectedPath("/account/orders"), true);
    assert.equal(isProtectedPath("/admin/products"), true);
    assert.equal(isProtectedPath("/create-organization"), true);
  });

  it("protects mutating APIs and returns them as API paths", () => {
    for (const path of [
      "/api/cart",
      "/api/cart/items/abc",
      "/api/checkout/create-intent",
      "/api/checkout/reverse-geocode",
      "/api/orders",
      "/api/account/addresses",
      "/api/admin/metrics",
      "/api/quick-order",
    ]) {
      assert.equal(isProtectedApiPath(path), true);
      assert.equal(isProtectedPath(path), true);
    }
  });

  it("leaves public catalog and webhook routes open", () => {
    assert.equal(isProtectedPath("/"), false);
    assert.equal(isProtectedPath("/catalog"), false);
    assert.equal(isProtectedPath("/api/products"), false);
    assert.equal(isProtectedPath("/api/categories"), false);
    assert.equal(isProtectedPath("/api/webhooks/clerk"), false);
    assert.equal(isProtectedPath("/api/webhooks/stripe"), false);
  });
});
