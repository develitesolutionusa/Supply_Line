import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { billableDeliveryKm, distanceKm } from "../lib/geo";

describe("delivery distance", () => {
  it("measures great-circle kilometers between two points", () => {
    const km = distanceKm({ lat: 32.7767, lon: -96.797 }, { lat: 32.7555, lon: -97.3308 });
    assert.ok(km != null);
    assert.ok(km > 45 && km < 55);
    assert.equal(billableDeliveryKm(km), Math.ceil(km));
  });

  it("bills a minimum of one kilometer", () => {
    assert.equal(billableDeliveryKm(0.2), 1);
    assert.equal(billableDeliveryKm(7.1), 8);
    assert.equal(distanceKm({ lat: 91, lon: 0 }, { lat: 0, lon: 0 }), null);
  });
});
