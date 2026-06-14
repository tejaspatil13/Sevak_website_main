'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Fragment, useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polygon, Popup, TileLayer, useMap } from 'react-leaflet';
import Link from 'next/link';
import { Landmark, LocateFixed, MapPin, Plus, X } from 'lucide-react';
import { MapIssue } from '@/lib/data';
import { NASHIK_WARDS, getWardByNumber, findWardForLocation } from '@/lib/wards';
import { getCurrentLocation, geoErrorMessage, GeoErrorReason } from '@/lib/geolocation';
import { getCorporatorsByWard } from '@/lib/corporators';
import {
  CATEGORY_LABELS,
  CATEGORY_STYLE,
  STATUS_BADGE,
  STATUS_LABELS,
  PARTY_ACCENT,
} from '@/types';
import { initials, wardLabel, wardNumber } from '@/lib/format';

// Default center: Nashik, Maharashtra.
const DEFAULT_CENTER: [number, number] = [19.9975, 73.7898];

// Ward boundaries are drawn as red outlines (like mycorporator.in); a selected ward gets a sky-blue highlight.
const WARD_OUTLINE_COLOR = '#DC2626';
const WARD_HIGHLIGHT_COLOR = '#0EA5E9';

const userLocationIcon = L.divIcon({
  className: '',
  html: '<div class="user-location-marker"><span class="user-location-pulse"></span><span class="user-location-dot"></span></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

/** Badge size shrinks at lower zoom levels so ward numbers don't clutter the zoomed-out map. */
function badgeSizeForZoom(zoom: number): { size: number; font: number } {
  if (zoom >= 15) return { size: 26, font: 12 };
  if (zoom >= 13) return { size: 20, font: 10 };
  if (zoom >= 11) return { size: 15, font: 8 };
  return { size: 11, font: 7 };
}

/** Circular numbered badge marking each ward's centroid, like mycorporator.in. */
function wardBadgeIcon(num: number, isSelected: boolean, zoom: number) {
  const { size, font } = badgeSizeForZoom(zoom);
  return L.divIcon({
    className: '',
    html: `<div class="ward-number-badge${isSelected ? ' ward-number-badge--selected' : ''}" style="width:${size}px;height:${size}px;font-size:${font}px;">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Pin-shaped marker for a reported issue — far more visible than a flat circle against the red ward outlines. */
function issuePinIcon(fillColor: string, ringColor: string) {
  return L.divIcon({
    className: '',
    html: `<div class="issue-pin" style="background:${fillColor};box-shadow:0 0 0 2px ${ringColor}, 0 2px 4px rgba(0,0,0,0.35);"><span class="issue-pin-dot"></span></div>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -30],
  });
}

/** Smoothly flies to the user's location the first time it becomes available. */
function FlyToUser({ location }: { location: [number, number] | null }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (location && !hasFlown.current) {
      hasFlown.current = true;
      map.flyTo(location, 16, { duration: 1.5 });
    }
  }, [location, map]);

  return null;
}

/** Floating control to (re)center the map on the user's current location. */
function LocateControl({
  userLocation,
  onLocate,
}: {
  userLocation: [number, number] | null;
  onLocate: () => Promise<[number, number] | null>;
}) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleClick = async () => {
    if (userLocation) {
      map.flyTo(userLocation, 16, { duration: 1.5 });
      return;
    }
    setLocating(true);
    const next = await onLocate();
    if (next) map.flyTo(next, 16, { duration: 1.5 });
    setLocating(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="absolute right-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-sm transition hover:bg-bg"
    >
      <LocateFixed size={14} className={locating ? 'animate-spin text-sky' : 'text-sky'} />
      {locating ? 'Locating…' : 'Detect Location'}
    </button>
  );
}

/** Reports the map's current zoom level to the parent so ward badges can resize. */
function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useEffect(() => {
    onZoomChange(map.getZoom());
    const handler = () => onZoomChange(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map, onZoomChange]);

  return null;
}

/** Round to ~100m grid cells to visualise complaint density. */
function densityCells(issues: MapIssue[]) {
  const cells = new Map<string, { latitude: number; longitude: number; count: number }>();
  for (const issue of issues) {
    const lat = Math.round(issue.latitude * 1000) / 1000;
    const lng = Math.round(issue.longitude * 1000) / 1000;
    const key = `${lat},${lng}`;
    const existing = cells.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      cells.set(key, { latitude: lat, longitude: lng, count: 1 });
    }
  }
  return [...cells.values()];
}

export function MapView({ issues }: { issues: MapIssue[] }) {
  const [userWard, setUserWard] = useState<{ num: number } | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<GeoErrorReason | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [zoom, setZoom] = useState(13);

  const requestLocation = (): Promise<[number, number] | null> =>
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        const ward = findWardForLocation(latitude, longitude);
        setUserLocation([latitude, longitude]);
        setUserWard({ num: ward.num });
        setLocationError(null);
        return [latitude, longitude] as [number, number];
      })
      .catch((reason: GeoErrorReason) => {
        setLocationError(reason);
        return null;
      });

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center: [number, number] = userLocation ?? DEFAULT_CENTER;

  const selectedWardData = selectedWard ? getWardByNumber(selectedWard) : null;
  const selectedWardIssues = selectedWard
    ? issues.filter((issue) => wardNumber(issue.ward_id) === selectedWard)
    : [];
  const selectedWardReps = selectedWard ? getCorporatorsByWard(selectedWard) : [];

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="isolate relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-line">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ZoomWatcher onZoomChange={setZoom} />

          {/* Ward boundaries — red outlines with numbered badges, click anywhere inside a ward to highlight it */}
          {NASHIK_WARDS.map((ward) => {
            const isSelected = selectedWard === ward.num;
            const onSelect = () => setSelectedWard((current) => (current === ward.num ? null : ward.num));
            return (
              <Fragment key={`ward-${ward.num}`}>
                <Polygon
                  positions={ward.polygon}
                  pathOptions={{
                    color: isSelected ? WARD_HIGHLIGHT_COLOR : WARD_OUTLINE_COLOR,
                    weight: isSelected ? 4 : 2,
                    fillColor: isSelected ? WARD_HIGHLIGHT_COLOR : WARD_OUTLINE_COLOR,
                    // fillOpacity stays >0 so the whole ward shape (not just the border) is clickable
                    fillOpacity: isSelected ? 0.18 : 0.04,
                  }}
                  eventHandlers={{ click: onSelect }}
                />
                <Marker
                  position={[ward.lat, ward.lng]}
                  icon={wardBadgeIcon(ward.num, isSelected, zoom)}
                  eventHandlers={{ click: onSelect }}
                />
              </Fragment>
            );
          })}

          {/* Density layer — larger, fainter circles show where complaints cluster */}
          {densityCells(issues)
            .filter((cell) => cell.count > 1)
            .map((cell) => (
              <CircleMarker
                key={`density-${cell.latitude}-${cell.longitude}`}
                center={[cell.latitude, cell.longitude]}
                radius={10 + Math.min(cell.count, 20) * 2}
                pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.12, weight: 0 }}
              />
            ))}

          {/* User location — distinct pulsing pin, map flies here on first fix */}
          {userLocation && (
            <>
              <FlyToUser location={userLocation} />
              <Marker position={userLocation} icon={userLocationIcon}>
                <Popup>You are here{userWard ? ` · Ward ${userWard.num}` : ''}</Popup>
              </Marker>
            </>
          )}

          {/* Individual issue markers — pin shape colored by category, ringed by community status */}
          {issues.map((issue) => {
            const { color: catColor } = CATEGORY_STYLE[issue.category];
            const { dot: statusColor } = STATUS_BADGE[issue.status];
            return (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={issuePinIcon(catColor, statusColor)}
              >
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="text-[12px] font-bold text-ink">{issue.title}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {CATEGORY_LABELS[issue.category]}
                      {wardLabel(issue.ward_id) ? ` · ${wardLabel(issue.ward_id)}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] font-bold" style={{ color: statusColor }}>
                      {STATUS_LABELS[issue.status]} · {issue.upvotes} votes
                    </p>
                    <Link href={`/issue/${issue.id}`} className="mt-1.5 block text-[11px] font-bold text-sky hover:underline">
                      View details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <LocateControl userLocation={userLocation} onLocate={requestLocation} />
        </MapContainer>

        <p className="pointer-events-none absolute bottom-2 left-2 z-[400] flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-muted shadow-sm">
          <MapPin size={12} className="text-sky" /> {issues.length} issue{issues.length === 1 ? '' : 's'} on map
        </p>

        {locationError && (
          <div className="absolute bottom-2 right-2 z-[400] flex max-w-[260px] items-start gap-2 rounded-lg bg-white/95 p-2.5 text-[11px] shadow-sm">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#EF4444]" />
            <div className="flex-1">
              <p className="font-bold text-ink">
                {locationError === 'unsupported'
                  ? 'Location not supported'
                  : locationError === 'denied'
                    ? 'Location access denied'
                    : 'Could not get your location'}
              </p>
              <p className="mt-0.5 text-muted">{geoErrorMessage(locationError)}</p>
              {locationError !== 'unsupported' && (
                <button
                  type="button"
                  onClick={() => requestLocation()}
                  className="mt-1 font-bold text-sky hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected ward details — representatives and issues, shown below the map */}
      {selectedWardData && (
        <div className="w-full max-w-full overflow-hidden rounded-xl border border-line bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 text-[14px] font-extrabold text-ink">
              <Landmark size={15} className="shrink-0 text-sky" /> <span className="truncate">Ward {selectedWardData.num}</span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/report?ward=${selectedWardData.num}`}
                className="flex items-center gap-1 rounded-full bg-sky px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky/90"
              >
                <Plus size={13} /> Report an Issue
              </Link>
              <button
                type="button"
                onClick={() => setSelectedWard(null)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted transition hover:bg-bg hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Representatives</p>
              {selectedWardReps.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-muted">No representatives found</p>
              ) : (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {selectedWardReps.map((c) => {
                    const accent = PARTY_ACCENT[c.party] || '#6B7280';
                    return (
                      <Link
                        key={c.srNo}
                        href={`/sevaks/${c.srNo}`}
                        className="flex items-center gap-2 rounded-md border border-line p-1.5 hover:bg-bg"
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                          style={{ backgroundColor: `${accent}26`, color: accent }}
                        >
                          {initials(c.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-ink">{c.name}</span>
                          <span className="block text-[11px] text-muted">Seat {c.seat} · {c.party}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Issues ({selectedWardIssues.length})
              </p>
              {selectedWardIssues.length === 0 ? (
                <p className="mt-1.5 text-[11px] text-muted">No issues reported yet</p>
              ) : (
                <div className="mt-1.5 flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
                  {selectedWardIssues.map((issue) => {
                    const { dot: statusColor } = STATUS_BADGE[issue.status];
                    return (
                      <Link
                        key={issue.id}
                        href={`/issue/${issue.id}`}
                        className="flex items-center gap-2 rounded-md border border-line p-1.5 hover:bg-bg"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: statusColor }} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-ink">{issue.title}</span>
                          <span className="block text-[11px] text-muted">
                            {CATEGORY_LABELS[issue.category]} · {issue.upvotes} votes
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
