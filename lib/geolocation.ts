export interface GeoResult {
  latitude: number;
  longitude: number;
}

export type GeoErrorReason = 'unsupported' | 'denied' | 'unavailable';

function toResult(pos: GeolocationPosition): GeoResult {
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
}

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// macOS/iOS CoreLocation often reports a transient "kCLErrorLocationUnknown"
// (POSITION_UNAVAILABLE) on the first request and recovers a second or two later,
// so unavailable/timeout errors are retried a few times with relaxed accuracy
// before giving up. Permission errors fail immediately — retrying won't help.
const ATTEMPTS: PositionOptions[] = [
  { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
  { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
  { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 },
];

/** Get the device's current position, retrying transient failures before giving up. */
export async function getCurrentLocation(): Promise<GeoResult> {
  if (!('geolocation' in navigator)) {
    throw 'unsupported' as GeoErrorReason;
  }

  for (let i = 0; i < ATTEMPTS.length; i++) {
    try {
      const pos = await getPosition(ATTEMPTS[i]);
      return toResult(pos);
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr.code === geoErr.PERMISSION_DENIED) {
        throw 'denied' as GeoErrorReason;
      }
      if (i < ATTEMPTS.length - 1) {
        await delay(1500);
      }
    }
  }

  throw 'unavailable' as GeoErrorReason;
}

/** Human-readable explanation + fix for a failed location request. */
export function geoErrorMessage(reason: GeoErrorReason): string {
  switch (reason) {
    case 'unsupported':
      return 'Location is not supported on this device.';
    case 'denied':
      return 'Location access was denied. Allow location access for this site in your browser settings, then retry.';
    case 'unavailable':
      return 'Could not get your location. On Mac, check System Settings → Privacy & Security → Location Services — make sure it is turned on and your browser is allowed, then retry.';
  }
}
