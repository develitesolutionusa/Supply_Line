import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { paymentIntentCreateParams } from "../lib/stripe/payment-intent";
import { stripeWebhookAction } from "../lib/stripe/webhook";

describe("paymentIntentCreateParams", () => {
  it("charges only the server-calculated amount and tags the order", () => {
    const params = paymentIntentCreateParams({
      amountCents: 4599,
      orderId: "ord_123",
      userId: "user_abc",
      customerId: "cus_biz",
    });

    assert.equal(params.amount, 4599);
    assert.equal(params.currency, "usd");
    assert.equal(params.metadata.order_id, "ord_123");
    assert.equal(params.metadata.user_id, "user_abc");
    assert.equal(params.customer, "cus_biz");
  });

  it("rejects a client-style zero or fractional amount", () => {
    assert.throws(() => paymentIntentCreateParams({ amountCents: 0, orderId: "ord_1", userId: "user_1" }));
    assert.throws(() => paymentIntentCreateParams({ amountCents: 10.5, orderId: "ord_1", userId: "user_1" }));
  });
});

describe("stripeWebhookAction", () => {
  it("marks paid or failed from PaymentIntent events and ignores the rest", () => {
    assert.deepEqual(
      stripeWebhookAction({
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_1", metadata: { order_id: "ord_1" } } },
      }),
      { action: "mark_paid", paymentIntentId: "pi_1", orderId: "ord_1" },
    );
    assert.deepEqual(
      stripeWebhookAction({
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_2", metadata: {} } },
      }),
      { action: "mark_failed", paymentIntentId: "pi_2", orderId: null },
    );
    assert.deepEqual(stripeWebhookAction({ type: "charge.succeeded", data: { object: { id: "ch_1" } } }), {
      action: "ignore",
      type: "charge.succeeded",
    });
  });
});
