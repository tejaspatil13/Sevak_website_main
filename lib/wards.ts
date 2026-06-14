import { NASHIK_WARDS_REAL } from './nashik-wards';

export interface Ward {
  num: number;
  name: string;
  lat: number;
  lng: number;
  /** [lat, lng] pairs */
  polygon: [number, number][];
  color: string;
}

export const NASHIK_WARDS = NASHIK_WARDS_REAL as Ward[];

/** ward_id UUIDs encode the ward number in the last 12 hex digits, e.g. ward 31 -> ...000000000031 */
export function wardIdFromNumber(num: number): string {
  return `00000000-0000-0000-0000-${String(num).padStart(12, '0')}`;
}

export function getWardByNumber(num: number | null | undefined): Ward | null {
  if (!num) return null;
  return NASHIK_WARDS.find((w) => w.num === num) ?? null;
}

/** Ray-casting point-in-polygon test. polygon is [lat, lng] pairs. */
function pointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const intersects =
      lngI > lng !== lngJ > lng &&
      lat < ((latJ - latI) * (lng - lngI)) / (lngJ - lngI) + latI;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return Math.hypot(lat1 - lat2, lng1 - lng2);
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates, in kilometers. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Find which ward a coordinate falls inside; falls back to the nearest ward centroid. */
export function findWardForLocation(lat: number, lng: number): Ward {
  const inside = NASHIK_WARDS.find((w) => pointInPolygon(lat, lng, w.polygon));
  if (inside) return inside;

  return NASHIK_WARDS.reduce((closest, w) =>
    distance(lat, lng, w.lat, w.lng) < distance(lat, lng, closest.lat, closest.lng) ? w : closest
  );
}
