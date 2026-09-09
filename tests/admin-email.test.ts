import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAdminLoginEmail, isAdminLoginEmail } from "../lib/auth/admin";

const allowlist = ["ops@example.com"];

describe("admin login email", () => {
  it("allows only addresses on the allowlist", () => {
    assert.equal(isAdminLoginEmail("ops@example.com", allowlist), true);
    assert.equal(isAdminLoginEmail("OPS@EXAMPLE.COM", allowlist), true);
    assert.equal(isAdminLoginEmail("  ops@example.com  ", allowlist), true);
  });

  it("rejects every other address", () => {
    assert.equal(isAdminLoginEmail("buyer@example.com", allowlist), false);
    assert.equal(isAdminLoginEmail(null, allowlist), false);
    assert.equal(isAdminLoginEmail("", allowlist), false);
    assert.equal(hasAdminLoginEmail(["buyer@example.com"], allowlist), false);
    assert.equal(hasAdminLoginEmail(["buyer@example.com", "ops@example.com"], allowlist), true);
  });
});
