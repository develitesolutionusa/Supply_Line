import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizeAdminMetrics } from "../lib/admin/metrics";

describe("admin metrics", () => {
  it("uses the rolling window for new accounts and average order value", () => {
    const metrics = summarizeAdminMetrics(
      {
        sales_cents: 10_000,
        paid_orders: 4,
        pending_orders: 2,
        new_accounts: 3,
      },
      "2026-08-05T00:00:00.000Z",
    );

    assert.equal(metrics.sales_cents, 10000);
    assert.equal(metrics.avg_order_value_cents, 2500);
    assert.equal(metrics.new_accounts, 3);
    assert.equal(metrics.pending_orders, 2);
    assert.equal(metrics.window_days, 30);
    assert.equal(metrics.since, "2026-08-05T00:00:00.000Z");
  });

  it("returns a zero average when there are no paid orders", () => {
    const metrics = summarizeAdminMetrics(
      {
        sales_cents: 0,
        paid_orders: 0,
        pending_orders: 1,
        new_accounts: 0,
      },
      "2026-08-05T00:00:00.000Z",
    );
    assert.equal(metrics.avg_order_value_cents, 0);
    assert.equal(metrics.new_accounts, 0);
  });
});
