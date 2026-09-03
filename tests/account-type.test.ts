import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBusinessAccountType, resolveAccountType } from "../lib/auth/accountType";

describe("account type", () => {
  it("treats only explicit business metadata as a company account", () => {
    assert.equal(resolveAccountType("business"), "business");
    assert.equal(resolveAccountType("individual"), "individual");
    assert.equal(resolveAccountType(undefined), "individual");
    assert.equal(isBusinessAccountType("individual"), false);
    assert.equal(isBusinessAccountType("business"), true);
  });
});
