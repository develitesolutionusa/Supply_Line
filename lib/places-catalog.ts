import { billableDeliveryKm, distanceKm } from "@/lib/geo";
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

export async function geocodeLocation(query: string) {
  const q = query.trim();
  if (!q) return null;

  const photon = (await readJson(
    `https://photon.komoot.io/api/?${new URLSearchParams({ q, limit: "1", lang: "en" }).toString()}`,
  )) as { features?: PhotonFeature[] } | null;
  for (const feature of photon?.features ?? []) {
    const lon = feature.geometry?.coordinates?.[0];
    const lat = feature.geometry?.coordinates?.[1];
    if (lat != null && lon != null && isValidCoord(lat, lon)) {
      return { lat, lon };
    }
  }

  const nominatim = await readJson(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q,
      format: "jsonv2",
      limit: "1",
    }).toString()}`,
  );
  if (!Array.isArray(nominatim) || nominatim.length === 0) return null;
  const first = nominatim[0] as NominatimPlace;
  const lat = first.lat == null || first.lat === "" ? undefined : Number(first.lat);
  const lon = first.lon == null || first.lon === "" ? undefined : Number(first.lon);
  if (lat == null || lon == null || !isValidCoord(lat, lon)) return null;
  return { lat, lon };
}

export async function resolveDeliveryKm(options: {
  origin?: string;
  originLat?: number;
  originLon?: number;
  destination?: string;
}) {
  const origin =
    options.originLat != null && options.originLon != null && isValidCoord(options.originLat, options.originLon)
      ? { lat: options.originLat, lon: options.originLon }
      : await geocodeLocation(options.origin ?? "");
  const destination = await geocodeLocation(options.destination ?? "");
  if (!origin || !destination) return null;
  const km = distanceKm(origin, destination);
  if (km == null) return null;
  return billableDeliveryKm(km);
}
