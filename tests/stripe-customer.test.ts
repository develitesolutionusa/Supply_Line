import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripeCustomerCreateParams } from "../lib/stripe/customer";

describe("stripe customer params", () => {
  it("tags the Stripe customer with the business account and org", () => {
    const params = stripeCustomerCreateParams({
      account: {
        id: "ba_1",
        clerk_org_id: "org_abc",
        company_name: "Harbor Kitchen",
        tax_exempt: false,
        stripe_customer_id: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      email: "chef@harbor.test",
      name: "Alex Chef",
    });

    assert.equal(params.email, "chef@harbor.test");
    assert.equal(params.name, "Alex Chef");
    assert.equal(params.metadata.business_account_id, "ba_1");
    assert.equal(params.metadata.clerk_org_id, "org_abc");
  });

  it("falls back to the company name when the buyer name is missing", () => {
    const params = stripeCustomerCreateParams({
      account: {
        id: "ba_2",
        clerk_org_id: null,
        company_name: "Solo Cafe",
        tax_exempt: false,
        stripe_customer_id: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
      email: null,
      name: null,
    });

    assert.equal(params.email, undefined);
    assert.equal(params.name, "Solo Cafe");
    assert.equal(params.metadata.clerk_org_id, "");
  });
});
