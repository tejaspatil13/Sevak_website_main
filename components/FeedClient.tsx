'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, MapPin } from 'lucide-react';
import { IssueCard } from './IssueCard';
import { NASHIK_WARDS, distanceKm, findWardForLocation } from '@/lib/wards';
import { getCurrentLocation, geoErrorMessage, GeoErrorReason } from '@/lib/geolocation';
import { wardNumber } from '@/lib/format';
import { Issue } from '@/types';

type Tab = 'for_you' | 'nearby' | 'my_ward' | 'most_voted' | 'recent';

const TABS: { value: Tab; label: string }[] = [
  { value: 'for_you', label: 'For You' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'my_ward', label: 'My Ward' },
  { value: 'most_voted', label: 'Most Voted' },
  { value: 'recent', label: 'Recent' },
];

export function FeedClient({ issues }: { issues: Issue[] }) {
  const [tab, setTab] = useState<Tab>('for_you');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userWardNum, setUserWardNum] = useState<number | null>(null);
  const [manualWard, setManualWard] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<GeoErrorReason | null>(null);

  useEffect(() => {
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setUserLocation([latitude, longitude]);
        setUserWardNum(findWardForLocation(latitude, longitude).num);
        setLocationError(null);
      })
      .catch((reason: GeoErrorReason) => setLocationError(reason));
  }, []);

  // Stable per-load random factor for discovery — recomputed only when the issue set changes.
  const discoverySeed = useMemo(() => {
    const seed = new Map<string, number>();
    for (const issue of issues) seed.set(issue.id, Math.random());
    return seed;
  }, [issues]);

  const activeWard = manualWard ?? userWardNum;

  const ranked = useMemo(() => {
    const now = Date.now();

    if (tab === 'recent') {
      return [...issues].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (tab === 'most_voted') {
      return [...issues].sort((a, b) => b.upvotes - a.upvotes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (tab === 'nearby') {
      if (!userLocation) return [];
      return [...issues].sort(
        (a, b) =>
          distanceKm(userLocation[0], userLocation[1], a.latitude, a.longitude) -
          distanceKm(userLocation[0], userLocation[1], b.latitude, b.longitude)
      );
    }

    if (tab === 'my_ward') {
      if (!activeWard) return [];
      return issues
        .filter((i) => wardNumber(i.ward_id) === activeWard)
        .sort((a, b) => b.upvotes - a.upvotes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // For You — blends nearby, ward match, recency, votes, underexposed, and discovery.
    return [...issues]
      .map((issue) => {
        let score = 0;

        if (userLocation) {
          const km = distanceKm(userLocation[0], userLocation[1], issue.latitude, issue.longitude);
          score += Math.max(0, 1 - km / 5) * 0.3;
        }

        if (activeWard && wardNumber(issue.ward_id) === activeWard) score += 0.25;

        const hoursOld = (now - new Date(issue.created_at).getTime()) / 3_600_000;
        score += Math.max(0, 1 - hoursOld / 72) * 0.2;

        score += Math.min(issue.upvotes / 50, 1) * 0.2;

        if (issue.upvotes < 3 && hoursOld > 6) score += 0.15;

        score += (discoverySeed.get(issue.id) ?? 0) * 0.15;

        return { issue, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((r) => r.issue);
  }, [tab, issues, userLocation, activeWard, discoverySeed]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className="whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition"
            style={
              tab === t.value
                ? { backgroundColor: '#003580', borderColor: '#003580', color: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', color: '#6B7280' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'my_ward' && !activeWard && (
        <div className="mt-4 flex flex-col items-start gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
            <MapPin size={15} className="text-sky" /> Pick your ward to see local complaints
          </p>
          <select
            onChange={(e) => setManualWard(Number(e.target.value) || null)}
            defaultValue=""
            className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink"
          >
            <option value="">Select a ward…</option>
            {NASHIK_WARDS.slice()
              .sort((a, b) => a.num - b.num)
              .map((w) => (
                <option key={w.num} value={w.num}>
                  Ward {w.num} · {w.name}
                </option>
              ))}
          </select>
        </div>
      )}

      {tab === 'nearby' && !userLocation && (
        <div className="mt-4 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3.5">
          <p className="text-[13px] font-bold text-ink">
            {locationError ? 'Could not get your location' : 'Allow location access to see nearby complaints'}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {locationError ? geoErrorMessage(locationError) : 'Your browser may prompt for permission — refresh after allowing.'}
          </p>
          {locationError && (
            <button
              type="button"
              onClick={() => {
                setLocationError(null);
                getCurrentLocation()
                  .then(({ latitude, longitude }) => {
                    setUserLocation([latitude, longitude]);
                    setUserWardNum(findWardForLocation(latitude, longitude).num);
                  })
                  .catch((reason: GeoErrorReason) => setLocationError(reason));
              }}
              className="mt-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-sky"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-[12px] font-semibold text-muted">
        {ranked.length} issue{ranked.length === 1 ? '' : 's'}
      </p>

      {ranked.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-white">
            <FileText size={32} className="text-sky" />
          </div>
          <p className="text-[16px] font-extrabold text-ink">No complaints found</p>
          <p className="text-[13px] text-muted">Try a different tab or filter</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
