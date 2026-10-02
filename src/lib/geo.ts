import { GEO } from './config';

const EARTH_RADIUS_KM = 6371;

/**
 * Разстояние по голям кръг между две точки (км).
 * Използва се за близост до университет.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function isNearUniversity(
  listing: { latApprox: number; lngApprox: number },
  university: { lat: number; lng: number },
  maxKm: number = GEO.universityNearbyKm,
): boolean {
  return (
    haversineKm(listing.latApprox, listing.lngApprox, university.lat, university.lng) <= maxKm
  );
}