'use client';

import { useMemo, useState } from 'react';
import { LocateFixed, Loader2, MapPin, Users } from 'lucide-react';
import { CorporatorCard } from './CorporatorCard';
import { findWardForLocation } from '@/lib/wards';
import { getCurrentLocation, geoErrorMessage, GeoErrorReason } from '@/lib/geolocation';
import { Corporator } from '@/lib/corporators';

const PAGE_SIZE = 24;

export function SevaksClient({ corporators }: { corporators: Corporator[] }) {
  const [userWard, setUserWard] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'pending' | 'ready' | 'error'>('idle');
  const [locationError, setLocationError] = useState<GeoErrorReason | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [selectedWard, setSelectedWard] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);

  const detectLocation = () => {
    setLocationStatus('pending');
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        setUserWard(findWardForLocation(latitude, longitude).num);
        setLocationStatus('ready');
        setLocationError(null);
        setShowAll(false);
        setSelectedWard('all');
        setPage(1);
      })
      .catch((reason: GeoErrorReason) => {
        setLocationStatus('error');
        setLocationError(reason);
      });
  };

  const wardNumbers = useMemo(
    () => [...new Set(corporators.map((c) => c.wardNo))].sort((a, b) => a - b),
    [corporators]
  );

  const filtered = useMemo(() => {
    if (!showAll) {
      if (!userWard) return [];
      return corporators.filter((c) => c.wardNo === userWard);
    }
    if (selectedWard === 'all') return corporators;
    return corporators.filter((c) => c.wardNo === selectedWard);
  }, [corporators, showAll, userWard, selectedWard]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page_ = Math.min(page, totalPages);
  const pageItems = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!showAll && userWard && (
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <MapPin size={15} className="text-sky" /> Ward {userWard}
            </p>
          )}
          {locationStatus === 'error' && locationError && (
            <p className="text-[12px] font-semibold text-[#B91C1C]">{geoErrorMessage(locationError)}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showAll && (
            <select
              value={selectedWard}
              onChange={(e) => {
                setSelectedWard(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-line bg-card px-2.5 py-2 text-[12px] font-semibold text-ink"
            >
              <option value="all">All Wards</option>
              {wardNumbers.map((num) => (
                <option key={num} value={num}>
                  Ward {num}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={detectLocation}
            disabled={locationStatus === 'pending'}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-bold text-ink disabled:opacity-60"
          >
            {locationStatus === 'pending' ? (
              <Loader2 size={14} className="animate-spin text-sky" />
            ) : (
              <LocateFixed size={14} className="text-sky" />
            )}
            {locationStatus === 'pending' ? 'Detecting…' : 'Detect Location'}
          </button>
          {!showAll && (
            <button
              type="button"
              onClick={() => {
                setShowAll(true);
                setSelectedWard('all');
                setPage(1);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-bold text-ink"
            >
              <Users size={14} />
              View All Corporators
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 mb-3 text-[12px] font-semibold text-muted">
        {filtered.length} corporator{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-6 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#BFDBFE] bg-white">
            <Users size={28} className="text-sky" />
          </div>
          <p className="text-[16px] font-extrabold text-ink">
            {!showAll && !userWard ? 'Enable location to see your ward' : 'No corporators found'}
          </p>
          <p className="text-[13px] text-muted">
            {!showAll && !userWard ? 'Or view all corporators across Nashik' : 'Try a different ward'}
          </p>
          {!showAll && !userWard && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-lg bg-sky px-3.5 py-2 text-[12px] font-bold text-white"
            >
              View All Corporators
            </button>
          )}
        </div>
      ) : (
        <>
          {pageItems.map((corporator) => (
            <CorporatorCard key={corporator.srNo} corporator={corporator} />
          ))}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page_ === 1}
                className="rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-bold text-ink disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-[12px] font-semibold text-muted">
                Page {page_} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page_ === totalPages}
                className="rounded-lg border border-line bg-card px-3 py-1.5 text-[12px] font-bold text-ink disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
