import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEARCH_RATE_LIMIT, WEBHOOK_RATE_LIMIT, withPublicRateLimit } from "../lib/http";

function requestFor(ip: string) {
  return new Request("http://localhost/api/products", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("withPublicRateLimit", () => {
  it("returns 429 with Retry-After after the window limit", async () => {
    const ip = `test-${Date.now()}-${Math.random()}`;
    assert.equal(await withPublicRateLimit(requestFor(ip), "http-test", 2), null);
    assert.equal(await withPublicRateLimit(requestFor(ip), "http-test", 2), null);
    const limited = await withPublicRateLimit(requestFor(ip), "http-test", 2);
    assert.ok(limited);
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("Retry-After"), "60");
  });

  it("keeps search tighter than webhook retries", () => {
    assert.ok(SEARCH_RATE_LIMIT < WEBHOOK_RATE_LIMIT);
  });
});
