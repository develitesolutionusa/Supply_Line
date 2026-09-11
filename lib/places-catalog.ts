import {
  DEFAULT_COUNTRY,
  DEFAULT_COUNTRY_CODE,
  PLACES_LIMIT,
  PLACES_USER_AGENT,
  dedupePlaces,
  filterNamedPlaces,
  filterSuggestions,
  formatNominatimPlace,
  composeLocation,
  mergePlaceGroups,
  namedPlace,
  normalizeCountryName,
  regionFromNominatim,
  usStateSuggestions,
  type NominatimPlace,
  type PlaceKind,
  type PlaceSuggestion,
  type RegionContext,
} from "@/lib/places";

type CountryRow = { name: string; Iso2?: string; iso2?: string };
type StateRow = { name?: string; state_code?: string };

const countriesCache: PlaceSuggestion[] = [];
const statesCache = new Map<string, PlaceSuggestion[]>();
const citiesCache = new Map<string, string[]>();

async function readJson(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (!response.ok) return null;
  return response.json();
}

async function nominatimJson(url: string) {
  return readJson(url, { headers: { "User-Agent": PLACES_USER_AGENT } });
}

export async function listCountries(query = ""): Promise<PlaceSuggestion[]> {
  if (countriesCache.length === 0) {
    const payload = (await readJson("https://countriesnow.space/api/v0.1/countries/iso")) as
      | { data?: CountryRow[] }
      | null;
    const rows = payload?.data ?? [];
    const places = rows
      .map((row) => {
        const name = row.name?.trim();
        const code = (row.Iso2 || row.iso2 || "").toLowerCase();
        return name ? namedPlace(name, "country", code.toUpperCase(), code) : null;
      })
      .filter((place): place is PlaceSuggestion => place != null)
      .sort((left, right) => left.primary.localeCompare(right.primary));
    if (places.length > 0) {
      countriesCache.push(...places);
    } else {
      countriesCache.push(namedPlace(DEFAULT_COUNTRY, "country", "US", DEFAULT_COUNTRY_CODE));
    }
  }
  const preferred = countriesCache.find((place) => place.primary === DEFAULT_COUNTRY);
  const rest = filterSuggestions(
    countriesCache.filter((place) => place.primary !== DEFAULT_COUNTRY),
    query,
  ).slice(0, 39);
  if (!query || preferred?.primary.toLowerCase().includes(query.trim().toLowerCase())) {
    return preferred ? [preferred, ...rest] : rest;
  }
  return rest;
}

export async function listStates(country: string, query = ""): Promise<PlaceSuggestion[]> {
  const name = normalizeCountryName(country);
  const cacheKey = name.toLowerCase();
  let states = statesCache.get(cacheKey);

  if (!states) {
    if (name === DEFAULT_COUNTRY) {
      states = usStateSuggestions();
    } else {
      const payload = (await readJson("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: name }),
      })) as { data?: { states?: StateRow[] } } | null;
      states = (payload?.data?.states ?? [])
        .map((row) => {
          const stateName = row.name?.trim();
          return stateName ? namedPlace(stateName, "state", row.state_code || "", row.state_code || "") : null;
        })
        .filter((place): place is PlaceSuggestion => place != null)
        .sort((left, right) => left.primary.localeCompare(right.primary));
      if (states.length === 0 && name === DEFAULT_COUNTRY) states = usStateSuggestions();
    }
    statesCache.set(cacheKey, states);
  }

  return filterSuggestions(states, query, 60);
}

export async function listCities(country: string, state: string, query = ""): Promise<PlaceSuggestion[]> {
  const countryName = normalizeCountryName(country);
  const stateName = state.trim();
  if (!stateName) return [];
  const cacheKey = `${countryName}|${stateName}`.toLowerCase();
  let cities = citiesCache.get(cacheKey);

  if (!cities) {
    const payload = (await readJson("https://countriesnow.space/api/v0.1/countries/state/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: countryName, state: stateName }),
    })) as { data?: string[] } | null;
    cities = (payload?.data ?? []).map((name) => name.trim()).filter(Boolean);
    if (cities.length === 0) {
      cities = await searchNominatimNames("city", { country: countryName, state: stateName, q: stateName });
    }
    citiesCache.set(cacheKey, cities);
  }

  if (cities.length === 0 && query.trim().length >= 2) {
    return searchNominatimPlaces("city", { country: countryName, state: stateName, q: query });
  }

  return filterNamedPlaces(cities, query, "city");
}

export async function searchStreets(options: {
  q: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
}): Promise<PlaceSuggestion[]> {
  const q = options.q.trim();
  if (q.length < 2) return [];
  return searchNominatimPlaces("street", {
    country: options.country,
    countryCode: options.countryCode,
    state: options.state,
    city: options.city,
    q,
  });
}

export async function searchMixed(options: {
  q?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
}): Promise<PlaceSuggestion[]> {
  const q = options.q?.trim() ?? "";
  const country = normalizeCountryName(options.country || DEFAULT_COUNTRY);
  const countryCode = options.countryCode || (country === DEFAULT_COUNTRY ? DEFAULT_COUNTRY_CODE : "");

  const [countries, states, cities, extraCities, streets] = await Promise.all([
    q.length >= 2 ? listCountries(q) : Promise.resolve([]),
    listStates(country, q),
    options.state ? listCities(country, options.state, q) : Promise.resolve([]),
    !options.state && q.length >= 2
      ? searchNominatimPlaces("city", { country, countryCode, q })
      : Promise.resolve([]),
    q.length >= 2
      ? searchStreets({ q, country, countryCode, state: options.state, city: options.city })
      : Promise.resolve([]),
  ]);

  const cityPlaces = [...cities, ...extraCities].map((place) => ({
    ...place,
    kind: "city" as const,
    label: place.label.includes(",")
      ? place.label
      : composeLocation({ city: place.primary, state: options.state, country }),
    secondary: options.state || place.secondary,
  }));

  return mergePlaceGroups({
    countries: countries.slice(0, 3),
    states: q ? states.slice(0, 12) : states,
    cities: cityPlaces.slice(0, 20),
    streets: streets.slice(0, 8),
  });
}

export async function resolveRegion(lat: number, lon: number): Promise<{ region: RegionContext; location: string }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    addressdetails: "1",
  });
  const payload = (await nominatimJson(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
  )) as NominatimPlace | null;
  const region = regionFromNominatim(payload);
  return {
    region,
    location: payload?.display_name?.trim() || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
  };
}

async function searchNominatimNames(kind: PlaceKind, options: { country?: string; state?: string; city?: string; q: string }) {
  const places = await searchNominatimPlaces(kind, options);
  return places.map((place) => place.primary);
}

async function searchNominatimPlaces(
  kind: PlaceKind,
  options: { country?: string; countryCode?: string; state?: string; city?: string; q: string },
) {
  const structured = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit: String(PLACES_LIMIT),
    dedupe: "1",
  });
  if (kind === "street") structured.set("street", options.q);
  if (kind === "city") structured.set("city", options.q);
  if (kind === "state") structured.set("state", options.q);
  if (options.city && kind === "street") structured.set("city", options.city);
  if (options.state) structured.set("state", options.state);
  if (options.country) structured.set("country", normalizeCountryName(options.country));
  if (options.countryCode) structured.set("countrycodes", options.countryCode.toLowerCase());
  if (kind === "city") structured.set("featureType", "city");

  let payload = await nominatimJson(`https://nominatim.openstreetmap.org/search?${structured.toString()}`);
  if (!Array.isArray(payload) || payload.length === 0) {
    const fallback = new URLSearchParams({
      q: [options.q, options.city, options.state, options.country].filter(Boolean).join(", "),
      format: "jsonv2",
      addressdetails: "1",
      limit: String(PLACES_LIMIT),
      dedupe: "1",
    });
    if (options.countryCode) fallback.set("countrycodes", options.countryCode.toLowerCase());
    payload = await nominatimJson(`https://nominatim.openstreetmap.org/search?${fallback.toString()}`);
  }
  if (!Array.isArray(payload)) return [];
  return dedupePlaces(
    (payload as NominatimPlace[])
      .map((item) => formatNominatimPlace(item, kind))
      .filter((place): place is PlaceSuggestion => place != null),
  );
}
