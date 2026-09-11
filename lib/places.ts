export const PLACES_USER_AGENT = "SupplyLineWholesale/1.0 (checkout location)";
export const PLACES_LIMIT = 8;
export const PLACES_LIST_LIMIT = 40;
export const DEFAULT_COUNTRY = "United States";
export const DEFAULT_COUNTRY_CODE = "us";

export type PlaceKind = "country" | "state" | "city" | "street";

export type PlaceSuggestion = {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  kind?: PlaceKind;
  code?: string;
};

export type RegionContext = {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  street: string;
  postcode: string;
};

export type NominatimAddress = {
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  state_code?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
};

export type NominatimPlace = {
  place_id?: number | string;
  osm_id?: number | string;
  addresstype?: string;
  type?: string;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

export const US_STATES: Array<[code: string, name: string]> = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

export function isValidCoord(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/** Nominatim viewbox: left,top,right,bottom (lon,lat,lon,lat). */
export function nearbyViewbox(lat: number, lon: number, degrees = 0.06) {
  return `${lon - degrees},${lat + degrees},${lon + degrees},${lat - degrees}`;
}

export function localityFromAddress(address?: NominatimAddress) {
  return (
    address?.road ||
    address?.suburb ||
    address?.neighbourhood ||
    address?.city ||
    address?.town ||
    address?.village ||
    address?.county ||
    ""
  );
}

export function normalizeCountryName(name: string) {
  const value = name.trim();
  if (!value) return DEFAULT_COUNTRY;
  if (/^(u\.?s\.?a?\.?|united states( of america)?)$/i.test(value)) return DEFAULT_COUNTRY;
  return value;
}

export function usStateSuggestions(): PlaceSuggestion[] {
  return US_STATES.map(([code, name]) => ({
    id: `state:${code}`,
    kind: "state",
    label: name,
    primary: name,
    secondary: code,
    code,
  }));
}

export function namedPlace(name: string, kind: PlaceKind, secondary = "", code = ""): PlaceSuggestion {
  return {
    id: `${kind}:${code || name}`.toLowerCase(),
    kind,
    label: name,
    primary: name,
    secondary,
    code,
  };
}

export function filterNamedPlaces(names: string[], query: string, kind: PlaceKind, limit = PLACES_LIST_LIMIT) {
  const needle = query.trim().toLowerCase();
  const matched = names
    .filter((name) => (needle ? name.toLowerCase().includes(needle) : true))
    .sort((left, right) => {
      if (!needle) return left.localeCompare(right);
      const leftRank = left.toLowerCase().startsWith(needle) ? 0 : 1;
      const rightRank = right.toLowerCase().startsWith(needle) ? 0 : 1;
      return leftRank - rightRank || left.localeCompare(right);
    })
    .slice(0, limit);
  return matched.map((name) => namedPlace(name, kind));
}

export function filterSuggestions(places: PlaceSuggestion[], query: string, limit = PLACES_LIST_LIMIT) {
  const needle = query.trim().toLowerCase();
  if (!needle) return places;
  return places
    .filter(
      (place) =>
        place.primary.toLowerCase().includes(needle) ||
        place.label.toLowerCase().includes(needle) ||
        place.code?.toLowerCase().includes(needle),
    )
    .slice(0, limit);
}

export function composeLocation(parts: { street?: string; city?: string; state?: string; country?: string }) {
  return [parts.street, parts.city, parts.state, parts.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export function emptyRegion(): RegionContext {
  return {
    country: DEFAULT_COUNTRY,
    countryCode: DEFAULT_COUNTRY_CODE,
    state: "",
    stateCode: "",
    city: "",
    street: "",
    postcode: "",
  };
}

export function regionFromNominatim(item: NominatimPlace | null): RegionContext {
  const address = item?.address;
  const country = normalizeCountryName(address?.country || DEFAULT_COUNTRY);
  return {
    country,
    countryCode: (address?.country_code || (country === DEFAULT_COUNTRY ? DEFAULT_COUNTRY_CODE : "")).toLowerCase(),
    state: address?.state?.trim() || "",
    stateCode: (address?.state_code || "").toUpperCase(),
    city: (address?.city || address?.town || address?.village || "").trim(),
    street: address?.road?.trim() || "",
    postcode: address?.postcode?.trim() || "",
  };
}

export function formatNominatimPlace(item: NominatimPlace, kind?: PlaceKind): PlaceSuggestion | null {
  const label = item.display_name?.trim();
  if (!label) return null;
  const primary = item.name?.trim() || label.split(",")[0]?.trim() || label;
  const parts = [
    item.address?.road,
    item.address?.city || item.address?.town || item.address?.village,
    item.address?.state,
    item.address?.country,
    item.address?.postcode,
  ].filter((part): part is string => Boolean(part && part !== primary));
  const secondary = [...new Set(parts)].join(", ");
  const id = String(item.place_id ?? item.osm_id ?? label);
  const resolvedKind = kind ?? kindFromNominatim(item);
  return {
    id,
    label,
    primary,
    secondary,
    ...(resolvedKind ? { kind: resolvedKind } : {}),
  };
}

function kindFromNominatim(item: NominatimPlace): PlaceKind | undefined {
  const type = item.addresstype || item.type;
  if (type === "country") return "country";
  if (type === "state") return "state";
  if (type === "city" || type === "town" || type === "village") return "city";
  if (type === "road" || type === "residential") return "street";
  return undefined;
}

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  country: "Country",
  state: "State",
  city: "City",
  street: "Street",
};

export function decoratePlace(place: PlaceSuggestion, extraSecondary = ""): PlaceSuggestion {
  const kindLabel = place.kind ? PLACE_KIND_LABEL[place.kind] : "";
  const secondary = [kindLabel, extraSecondary || place.secondary].filter(Boolean).join(" · ");
  return { ...place, secondary };
}

export function mergePlaceGroups(groups: {
  countries?: PlaceSuggestion[];
  states?: PlaceSuggestion[];
  cities?: PlaceSuggestion[];
  streets?: PlaceSuggestion[];
}) {
  return dedupePlaces([
    ...(groups.countries ?? []).map((place) => decoratePlace(place)),
    ...(groups.states ?? []).map((place) => decoratePlace(place)),
    ...(groups.cities ?? []).map((place) => decoratePlace(place)),
    ...(groups.streets ?? []).map((place) => decoratePlace(place)),
  ]);
}

export function selectionLabel(
  place: PlaceSuggestion,
  region?: Pick<RegionContext, "country" | "state" | "city">,
) {
  if (place.kind === "street" && place.label.includes(",")) return place.label;
  if (place.kind === "country") return place.primary;
  if (place.kind === "state") {
    return composeLocation({ state: place.primary, country: region?.country || DEFAULT_COUNTRY });
  }
  if (place.kind === "city") {
    return composeLocation({
      city: place.primary,
      state: region?.state,
      country: region?.country || DEFAULT_COUNTRY,
    });
  }
  if (place.kind === "street") {
    return composeLocation({
      street: place.primary,
      city: region?.city,
      state: region?.state,
      country: region?.country || DEFAULT_COUNTRY,
    });
  }
  return place.label;
}

export function dedupePlaces(places: PlaceSuggestion[]) {
  const seen = new Set<string>();
  const result: PlaceSuggestion[] = [];
  for (const place of places) {
    const key = place.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(place);
  }
  return result;
}
