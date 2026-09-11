import {
  DEFAULT_COUNTRY_CODE,
  PLACES_USER_AGENT,
  dedupePlaces,
  formatNominatimPlace,
  formatPhotonFeature,
  isValidCoord,
  nearbyViewbox,
  regionFromNominatim,
  type NominatimPlace,
  type PhotonFeature,
  type PlaceSuggestion,
  type RegionContext,
} from "@/lib/places";

async function readJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": PLACES_USER_AGENT },
  });
  if (!response.ok) return null;
  return response.json();
}

async function photonSearch(query: string, lat?: number, lon?: number): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: "8",
    lang: "en",
  });
  if (lat != null && lon != null && isValidCoord(lat, lon)) {
    params.set("lat", String(lat));
    params.set("lon", String(lon));
  }
  const payload = (await readJson(`https://photon.komoot.io/api/?${params.toString()}`)) as
    | { features?: PhotonFeature[] }
    | null;
  return dedupePlaces(
    (payload?.features ?? [])
      .map(formatPhotonFeature)
      .filter((place): place is PlaceSuggestion => place != null),
  );
}

async function nominatimSearch(query: string, lat?: number, lon?: number): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "8",
    dedupe: "1",
  });
  if (lat != null && lon != null && isValidCoord(lat, lon)) {
    params.set("viewbox", nearbyViewbox(lat, lon));
  }
  const payload = await readJson(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!Array.isArray(payload)) return [];
  return dedupePlaces(
    (payload as NominatimPlace[])
      .map(formatNominatimPlace)
      .filter((place): place is PlaceSuggestion => place != null),
  );
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ location: string; region: RegionContext }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
    addressdetails: "1",
  });
  const payload = (await readJson(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
  )) as NominatimPlace | null;
  const region = regionFromNominatim(payload);
  return {
    location: payload?.display_name?.trim() || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
    region,
  };
}

async function nearbySuggestions(region: RegionContext, lat: number, lon: number) {
  const seed = region.street || region.city || region.state || DEFAULT_COUNTRY_CODE;
  const photon = await photonSearch(seed, lat, lon);
  if (photon.length > 0) return photon.slice(0, 12);
  return nominatimSearch(seed, lat, lon);
}

export async function searchPlaces(options: {
  q?: string;
  lat?: number;
  lon?: number;
  countryCode?: string;
}): Promise<PlaceSuggestion[]> {
  const query = options.q?.trim() ?? "";
  if (query.length >= 2) {
    const photon = await photonSearch(query, options.lat, options.lon);
    if (photon.length > 0) return photon;
    return nominatimSearch(query, options.lat, options.lon);
  }

  if (options.lat == null || options.lon == null) return [];
  const { region } = await reverseGeocode(options.lat, options.lon);
  return nearbySuggestions(region, options.lat, options.lon);
}

export async function resolveRegion(lat: number, lon: number) {
  const resolved = await reverseGeocode(lat, lon);
  const places = await nearbySuggestions(resolved.region, lat, lon);
  return { ...resolved, places };
}
