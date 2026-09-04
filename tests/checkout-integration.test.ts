import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import Stripe from "stripe";
import { paymentIntentCreateParams } from "../lib/stripe/payment-intent";

function loadLocalEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const secret = process.env.STRIPE_SECRET_KEY ?? "";
const runLive = secret.startsWith("sk_test_");

(runLive ? describe : describe.skip)("Stripe test-mode checkout", () => {
  const stripe = new Stripe(secret);

  it("creates a test clock, confirms a visa test card, and declines a failed card", async () => {
    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
    });
    const customer = await stripe.customers.create({
      name: "B8 checkout test",
      test_clock: clock.id,
    });

    try {
      const succeeded = await stripe.paymentIntents.create({
        ...paymentIntentCreateParams({
          amountCents: 2499,
          orderId: "ord_b8_visa",
          userId: "user_b8",
          customerId: customer.id,
        }),
        payment_method: "pm_card_visa",
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      });

      assert.equal(succeeded.status, "succeeded");
      assert.equal(succeeded.amount, 2499);
      assert.equal(succeeded.metadata.order_id, "ord_b8_visa");
      assert.equal(succeeded.currency, "usd");

      await assert.rejects(
        stripe.paymentIntents.create({
          ...paymentIntentCreateParams({
            amountCents: 1200,
            orderId: "ord_b8_declined",
            userId: "user_b8",
            customerId: customer.id,
          }),
          payment_method: "pm_card_chargeDeclined",
          confirm: true,
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        }),
        (error: unknown) => {
          const code = error instanceof Stripe.errors.StripeCardError ? error.code : undefined;
          assert.equal(code, "card_declined");
          return true;
        },
      );
    } finally {
      await stripe.customers.del(customer.id).catch(() => undefined);
      await stripe.testHelpers.testClocks.advance(clock.id, {
        frozen_time: Math.floor(Date.now() / 1000) + 60,
      }).catch(() => undefined);
    }
  });

  it("verifies a signed webhook payload", () => {
    const payload = JSON.stringify({
      id: "evt_b8",
      object: "event",
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_b8", metadata: { order_id: "ord_b8_visa" } } },
    });
    const secretName = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_b8";
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: secretName });
    const event = stripe.webhooks.constructEvent(payload, header, secretName);
    assert.equal(event.type, "payment_intent.succeeded");
  });
});
