import { isValidCoord } from "@/lib/places";

export type GeoPoint = { lat: number; lon: number };

const EARTH_RADIUS_KM = 6371;

export function distanceKm(from: GeoPoint, to: GeoPoint) {
  if (!isValidCoord(from.lat, from.lon) || !isValidCoord(to.lat, to.lon)) {
    return null;
  }

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function billableDeliveryKm(km: number) {
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.max(1, Math.ceil(km));
}
