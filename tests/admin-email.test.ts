import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasAdminLoginEmail, isAdminLoginEmail } from "../lib/auth/admin";

const allowlist = ["husbantech08@gmail.com"];

describe("admin login email", () => {
  it("allows only the designated admin email", () => {
    assert.equal(isAdminLoginEmail("husbantech08@gmail.com", allowlist), true);
    assert.equal(isAdminLoginEmail("HUSBANTECH08@GMAIL.COM", allowlist), true);
    assert.equal(isAdminLoginEmail("  husbantech08@gmail.com  ", allowlist), true);
  });

  it("rejects every other address", () => {
    assert.equal(isAdminLoginEmail("buyer@example.com", allowlist), false);
    assert.equal(isAdminLoginEmail(null, allowlist), false);
    assert.equal(isAdminLoginEmail("", allowlist), false);
    assert.equal(hasAdminLoginEmail(["buyer@example.com"], allowlist), false);
    assert.equal(hasAdminLoginEmail(["buyer@example.com", "husbantech08@gmail.com"], allowlist), true);
  });
});
