import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripeBuyerCustomerCreateParams, stripeCustomerCreateParams } from "../lib/stripe/customer";

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

describe("stripe buyer customer params", () => {
  it("tags an individual checkout customer with the app user", () => {
    const params = stripeBuyerCustomerCreateParams({
      user: { id: "usr_1", clerk_user_id: "user_abc" },
      email: "buyer@example.com",
      name: "Pat Buyer",
    });

    assert.equal(params.email, "buyer@example.com");
    assert.equal(params.name, "Pat Buyer");
    assert.equal(params.metadata.user_id, "usr_1");
    assert.equal(params.metadata.clerk_user_id, "user_abc");
  });

  it("falls back to email then a generic name", () => {
    const withEmail = stripeBuyerCustomerCreateParams({
      user: { id: "usr_2", clerk_user_id: "user_def" },
      email: "solo@example.com",
      name: null,
    });
    assert.equal(withEmail.name, "solo@example.com");

    const anonymous = stripeBuyerCustomerCreateParams({
      user: { id: "usr_3", clerk_user_id: "user_ghi" },
      email: null,
      name: null,
    });
    assert.equal(anonymous.name, "SupplyLine buyer");
    assert.equal(anonymous.email, undefined);
  });
});
