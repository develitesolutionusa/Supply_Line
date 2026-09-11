import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  composeLocation,
  dedupePlaces,
  filterNamedPlaces,
  formatNominatimPlace,
  isValidCoord,
  localityFromAddress,
  mergePlaceGroups,
  nearbyViewbox,
  normalizeCountryName,
  regionFromNominatim,
  selectionLabel,
  usStateSuggestions,
} from "../lib/places";

describe("places helpers", () => {
  it("builds a nominatim viewbox around the user", () => {
    assert.equal(nearbyViewbox(30, -90, 1), "-91,31,-89,29");
  });

  it("prefers the nearest named road or neighborhood for nearby search", () => {
    assert.equal(localityFromAddress({ road: "Main St", city: "Dallas" }), "Main St");
    assert.equal(localityFromAddress({ city: "Dallas" }), "Dallas");
    assert.equal(localityFromAddress({}), "");
  });

  it("formats and dedupes nominatim results", () => {
    const place = formatNominatimPlace({
      place_id: 1,
      name: "Main Street Market",
      display_name: "Main Street Market, Main St, Dallas, TX 75201",
      address: { road: "Main St", city: "Dallas", state: "TX", postcode: "75201" },
    });
    assert.deepEqual(place, {
      id: "1",
      label: "Main Street Market, Main St, Dallas, TX 75201",
      primary: "Main Street Market",
      secondary: "Main St, Dallas, TX, 75201",
    });
    assert.equal(formatNominatimPlace({ name: "Nowhere" }), null);

    const dupes = dedupePlaces([
      place!,
      { ...place!, id: "2" },
      { id: "3", label: "Other Place", primary: "Other Place", secondary: "" },
    ]);
    assert.equal(dupes.length, 2);
    assert.equal(dupes[1].id, "3");
  });

  it("rejects out-of-range coordinates", () => {
    assert.equal(isValidCoord(32.78, -96.8), true);
    assert.equal(isValidCoord(91, 0), false);
    assert.equal(isValidCoord(0, 181), false);
  });

  it("normalizes US country names and composes a structured location", () => {
    assert.equal(normalizeCountryName("USA"), "United States");
    assert.equal(normalizeCountryName("United States of America"), "United States");
    assert.equal(normalizeCountryName("Canada"), "Canada");
    assert.equal(
      composeLocation({ street: "Main St", city: "Dallas", state: "Texas", country: "United States" }),
      "Main St, Dallas, Texas, United States",
    );
  });

  it("lists US states and filters cities for live search", () => {
    const texas = usStateSuggestions().find((place) => place.code === "TX");
    assert.equal(texas?.primary, "Texas");
    assert.equal(usStateSuggestions().length, 51);
    assert.deepEqual(
      filterNamedPlaces(["Dallas", "Austin", "Houston", "Denton"], "da", "city").map((place) => place.primary),
      ["Dallas"],
    );
  });

  it("reads country, state, city, and street from a reverse-geocode result", () => {
    const region = regionFromNominatim({
      address: {
        country: "United States of America",
        country_code: "us",
        state: "Texas",
        state_code: "TX",
        city: "Dallas",
        road: "Main Street",
      },
    });
    assert.equal(region.country, "United States");
    assert.equal(region.countryCode, "us");
    assert.equal(region.state, "Texas");
    assert.equal(region.city, "Dallas");
    assert.equal(region.street, "Main Street");
  });

  it("merges states, cities, and streets into one labeled list", () => {
    const merged = mergePlaceGroups({
      states: [{ id: "s", label: "Texas", primary: "Texas", secondary: "TX", kind: "state", code: "TX" }],
      cities: [{ id: "c", label: "Dallas", primary: "Dallas", secondary: "", kind: "city" }],
      streets: [{ id: "r", label: "Main St, Dallas, Texas", primary: "Main St", secondary: "Dallas", kind: "street" }],
    });
    assert.equal(merged.length, 3);
    assert.equal(merged[0].secondary, "State · TX");
    assert.equal(merged[1].secondary, "City");
    assert.equal(merged[2].secondary, "Street · Dallas");
    assert.equal(
      selectionLabel(merged[1], { country: "United States", state: "Texas", city: "" }),
      "Dallas, Texas, United States",
    );
  });
});
