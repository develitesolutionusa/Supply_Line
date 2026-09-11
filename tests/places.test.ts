import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeLocation,
  dedupePlaces,
  formatNominatimPlace,
  formatPhotonFeature,
  isValidCoord,
  kindFromPhotonType,
  nearbyViewbox,
  normalizeCountryName,
  regionFromNominatim,
  selectionLabel,
} from "../lib/places";

describe("places helpers", () => {
  it("rejects out-of-range coordinates and builds a nearby viewbox", () => {
    assert.equal(isValidCoord(32.78, -96.8), true);
    assert.equal(isValidCoord(91, 0), false);
    assert.equal(nearbyViewbox(30, -90, 1), "-91,31,-89,29");
  });

  it("maps free Photon types to country, state, city, or street", () => {
    assert.equal(kindFromPhotonType("country"), "country");
    assert.equal(kindFromPhotonType("state"), "state");
    assert.equal(kindFromPhotonType("city"), "city");
    assert.equal(kindFromPhotonType("street"), "street");
  });

  it("formats Photon and Nominatim results for one search list", () => {
    const photon = formatPhotonFeature({
      properties: {
        osm_id: 1,
        name: "Dallas",
        state: "Texas",
        country: "United States",
        type: "city",
      },
    });
    assert.deepEqual(photon, {
      id: "1",
      label: "Dallas, Texas, United States",
      primary: "Dallas",
      secondary: "City · Texas, United States",
      kind: "city",
      code: undefined,
    });

    const nominatim = formatNominatimPlace({
      place_id: 2,
      name: "Main Street",
      display_name: "Main Street, Dallas, Texas, United States",
      addresstype: "road",
      address: { road: "Main Street", city: "Dallas", state: "Texas", country: "United States" },
    });
    assert.equal(nominatim?.kind, "street");
    assert.equal(formatPhotonFeature({}), null);
    assert.equal(dedupePlaces([photon!, { ...photon!, id: "other" }]).length, 1);
  });

  it("reads a reverse-geocode result into region parts", () => {
    const region = regionFromNominatim({
      address: {
        country: "United States of America",
        country_code: "us",
        state: "Texas",
        city: "Dallas",
        road: "Main Street",
        postcode: "75201",
      },
    });
    assert.equal(region.country, "United States");
    assert.equal(region.countryCode, "us");
    assert.equal(region.state, "Texas");
    assert.equal(region.city, "Dallas");
    assert.equal(region.street, "Main Street");
  });

  it("composes a location from the detected region", () => {
    assert.equal(normalizeCountryName("USA"), "United States");
    assert.equal(
      composeLocation({ street: "Main St", city: "Dallas", state: "Texas", country: "United States" }),
      "Main St, Dallas, Texas, United States",
    );
    assert.equal(
      selectionLabel(
        { id: "1", label: "Dallas", primary: "Dallas", secondary: "City", kind: "city" },
        { country: "United States", state: "Texas", city: "" },
      ),
      "Dallas, Texas, United States",
    );
  });
});
