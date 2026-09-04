import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canAccessOrder } from "../lib/orders/access";

describe("order access", () => {
  it("allows the buyer who placed the order", () => {
    assert.equal(
      canAccessOrder({ userId: "user_1", orgId: null }, { user_id: "user_1", org_id: null }),
      true,
    );
  });

  it("allows a teammate on the same business account", () => {
    assert.equal(
      canAccessOrder(
        { userId: "user_2", orgId: "org_1" },
        { user_id: "user_1", org_id: "org_1" },
      ),
      true,
    );
  });

  it("rejects another buyer or business", () => {
    assert.equal(
      canAccessOrder({ userId: "user_2", orgId: null }, { user_id: "user_1", org_id: null }),
      false,
    );
    assert.equal(
      canAccessOrder(
        { userId: "user_2", orgId: "org_2" },
        { user_id: "user_1", org_id: "org_1" },
      ),
      false,
    );
  });
});
