export const PLACES_USER_AGENT = "SupplyLineWholesale/1.0 (checkout location)";
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
  address?: NominatimAddress;
};

export type PhotonFeature = {
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    type?: string;
  };
};

export const PLACE_KIND_LABEL: Record<PlaceKind, string> = {
  country: "Country",
  state: "State",
  city: "City",
  street: "Street",
};

export function isValidCoord(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function nearbyViewbox(lat: number, lon: number, degrees = 0.08) {
  return `${lon - degrees},${lat + degrees},${lon + degrees},${lat - degrees}`;
}

export function normalizeCountryName(name: string) {
  const value = name.trim();
  if (!value) return DEFAULT_COUNTRY;
  if (/^(u\.?s\.?a?\.?|united states( of america)?)$/i.test(value)) return DEFAULT_COUNTRY;
  return value;
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

export function kindFromPhotonType(type?: string): PlaceKind | undefined {
  if (type === "country") return "country";
  if (type === "state") return "state";
  if (type === "city" || type === "district" || type === "locality" || type === "county") return "city";
  if (type === "street" || type === "house") return "street";
  return undefined;
}

export function formatPhotonFeature(feature: PhotonFeature): PlaceSuggestion | null {
  const props = feature.properties;
  if (!props) return null;
  const primary = props.name?.trim() || props.street?.trim();
  const parts = [props.street, props.city, props.state, props.country, props.postcode].filter(
    (part): part is string => Boolean(part && part !== primary),
  );
  const label = [primary, ...parts.filter((part, index) => parts.indexOf(part) === index)].filter(Boolean).join(", ");
  if (!primary || !label) return null;
  const kind = kindFromPhotonType(props.type);
  const secondary = [kind ? PLACE_KIND_LABEL[kind] : "", [...new Set(parts)].join(", ")].filter(Boolean).join(" · ");
  return {
    id: String(props.osm_id ?? label),
    label,
    primary,
    secondary,
    kind,
    code: props.countrycode?.toLowerCase(),
  };
}

export function regionFromNominatim(item: NominatimPlace | null): RegionContext {
  const address = item?.address;
  const country = normalizeCountryName(address?.country || DEFAULT_COUNTRY);
  return {
    country,
    countryCode: (address?.country_code || (country === DEFAULT_COUNTRY ? DEFAULT_COUNTRY_CODE : "")).toLowerCase(),
    state: address?.state?.trim() || "",
    stateCode: "",
    city: (address?.city || address?.town || address?.village || "").trim(),
    street: address?.road?.trim() || "",
    postcode: address?.postcode?.trim() || "",
  };
}

export function formatNominatimPlace(item: NominatimPlace): PlaceSuggestion | null {
  const label = item.display_name?.trim();
  if (!label) return null;
  const primary = item.name?.trim() || label.split(",")[0]?.trim() || label;
  const parts = [
    item.address?.road,
    item.address?.city || item.address?.town || item.address?.village,
    item.address?.state,
    item.address?.country,
  ].filter((part): part is string => Boolean(part && part !== primary));
  const kind =
    item.addresstype === "country"
      ? "country"
      : item.addresstype === "state"
        ? "state"
        : item.addresstype === "city" || item.addresstype === "town"
          ? "city"
          : item.addresstype === "road"
            ? "street"
            : undefined;
  return {
    id: String(item.place_id ?? item.osm_id ?? label),
    label,
    primary,
    secondary: [kind ? PLACE_KIND_LABEL[kind] : "", ...new Set(parts)].filter(Boolean).join(" · "),
    kind,
  };
}

export function selectionLabel(
  place: PlaceSuggestion,
  region?: Pick<RegionContext, "country" | "state" | "city">,
) {
  if (place.label.includes(",")) return place.label;
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
