import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memoryRateLimit } from "../lib/rate-limit";

describe("memoryRateLimit", () => {
  it("allows requests until the window limit is exceeded", () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    assert.equal(memoryRateLimit(key, 2, 60_000).ok, true);
    assert.equal(memoryRateLimit(key, 2, 60_000).ok, true);
    assert.equal(memoryRateLimit(key, 2, 60_000).ok, false);
  });
});
