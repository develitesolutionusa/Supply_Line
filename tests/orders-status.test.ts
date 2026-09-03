import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertStatusTransition } from "../lib/orders/status";

describe("order status machine", () => {
  it("allows pending to paid, cancelled, or payment_failed", () => {
    assert.doesNotThrow(() => assertStatusTransition("pending", "paid"));
    assert.doesNotThrow(() => assertStatusTransition("pending", "cancelled"));
    assert.doesNotThrow(() => assertStatusTransition("pending", "payment_failed"));
  });

  it("allows paid to fulfilled or cancelled", () => {
    assert.doesNotThrow(() => assertStatusTransition("paid", "fulfilled"));
    assert.doesNotThrow(() => assertStatusTransition("paid", "cancelled"));
  });

  it("rejects illegal transitions", () => {
    assert.throws(() => assertStatusTransition("fulfilled", "paid"));
    assert.throws(() => assertStatusTransition("cancelled", "pending"));
    assert.throws(() => assertStatusTransition("pending", "fulfilled"));
  });
});
