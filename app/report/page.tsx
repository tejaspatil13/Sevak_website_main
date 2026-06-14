'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, MapPin, Map as MapIcon, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CATEGORY_ICONS } from '@/components/CategoryChip';
import { VoteButton } from '@/components/VoteButton';
import { supabase } from '@/lib/supabase';
import { findNearbyIssues } from '@/lib/data';
import { getAnonIdentity } from '@/lib/anon';
import { NASHIK_WARDS, findWardForLocation, getWardByNumber, wardIdFromNumber } from '@/lib/wards';
import { getCurrentLocation, geoErrorMessage, GeoErrorReason } from '@/lib/geolocation';
import { compressImage } from '@/lib/image';
import { Issue, IssueCategory, CATEGORY_LABELS, CATEGORY_STYLE } from '@/types';

const CATEGORY_OPTIONS: IssueCategory[] = [
  'garbage',
  'pothole',
  'streetlight',
  'water',
  'drainage',
  'encroachment',
  'other',
];

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      latitude: number;
      longitude: number;
      address: string | null;
      wardNum: number;
      source: 'gps' | 'manual';
    };

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportForm />
    </Suspense>
  );
}

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [nearby, setNearby] = useState<Issue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  };

  const detectLocation = () => {
    setLocation({ status: 'loading' });
    getCurrentLocation()
      .then(({ latitude, longitude }) => {
        const ward = findWardForLocation(latitude, longitude);

        // Show the ward immediately — don't block on the reverse-geocode network call.
        setLocation({ status: 'ready', latitude, longitude, address: null, wardNum: ward.num, source: 'gps' });

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((json) => {
            const address = json?.display_name ?? null;
            setLocation((current) =>
              current.status === 'ready' && current.source === 'gps' ? { ...current, address } : current
            );
          })
          .catch(() => {
            // best-effort — address stays null
          });
      })
      .catch((reason: GeoErrorReason) => {
        setLocation({ status: 'error', message: `${geoErrorMessage(reason)} Or pick your ward below.` });
      });
  };

  // On open: if a ward was passed from the map ("Report from Map"), use it directly
  // without touching GPS. Otherwise start detecting the user's live location.
  useEffect(() => {
    const wardParam = searchParams.get('ward');
    const wardNum = wardParam ? Number(wardParam) : NaN;
    const ward = Number.isFinite(wardNum) ? getWardByNumber(wardNum) : undefined;
    if (ward) {
      setLocation({ status: 'ready', latitude: ward.lat, longitude: ward.lng, address: null, wardNum: ward.num, source: 'manual' });
      return;
    }
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once both a category and a location are known, check for similar open reports nearby.
  useEffect(() => {
    if (!category || location.status !== 'ready') {
      setNearby([]);
      return;
    }
    let cancelled = false;
    findNearbyIssues({ latitude: location.latitude, longitude: location.longitude, category }).then((results) => {
      if (!cancelled) setNearby(results);
    });
    return () => {
      cancelled = true;
    };
  }, [category, location]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!photoFile) return setError('Please add a photo of the issue.');
    if (!category) return setError('Please select a category.');
    if (location.status !== 'ready') return setError('Please allow location access so we can pin this to your ward.');

    setSubmitting(true);
    try {
      const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `reports/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('issue-photos')
        .upload(path, photoFile, { contentType: photoFile.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('issue-photos').getPublicUrl(path);

      const title = `${CATEGORY_LABELS[category]} — Ward ${location.wardNum}`;

      const { data, error: insertError } = await supabase
        .from('issues')
        .insert({
          citizen_id: null,
          reporter_name: getAnonIdentity().name,
          ward_id: wardIdFromNumber(location.wardNum),
          title,
          description: null,
          category,
          status: 'pending',
          before_photo_url: urlData.publicUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          location_address: location.address ?? `Ward ${location.wardNum}`,
          upvotes: 0,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      router.push(`/feed?posted=${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not submit your report — ${err.message}`
          : 'Something went wrong submitting your report. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const canSubmit = !!photoFile && !!category && location.status === 'ready' && !submitting;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="bg-navy">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Report an Issue</h1>
          <p className="mt-1 text-[13px] text-white/65">
            Snap a photo, confirm your location, pick a category — done. No typing needed.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Photo */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">1. Photo</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="relative mt-2 block aspect-video w-full overflow-hidden rounded-xl border border-line"
              >
                <Image src={photoPreview} alt="Selected issue photo" fill className="object-cover" unoptimized />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">
                  Change photo
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-card py-10 text-muted transition hover:border-sky hover:text-sky"
              >
                <Camera size={28} />
                <span className="text-[13px] font-bold">Take or upload a photo</span>
              </button>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">2. Location</label>
            {location.status === 'ready' ? (
              <div className="mt-2 flex items-start gap-3 rounded-xl border border-line bg-card p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">Ward {location.wardNum}</p>
                  <p className="truncate text-[11px] text-muted">
                    {location.source === 'manual'
                      ? 'Selected on map'
                      : location.address ?? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className="shrink-0 text-[12px] font-bold text-sky hover:underline"
                >
                  {location.source === 'manual' ? 'Use My Location' : 'Refresh'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={detectLocation}
                disabled={location.status === 'loading'}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card py-3 text-[13px] font-bold text-sky transition hover:border-sky disabled:opacity-60"
              >
                {location.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                {location.status === 'loading' ? 'Detecting your location…' : 'Allow location access'}
              </button>
            )}
            {location.status === 'error' && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#B91C1C]">
                <AlertTriangle size={13} /> {location.message}
              </p>
            )}
            <select
              value={location.status === 'ready' && location.source === 'manual' ? location.wardNum : ''}
              onChange={(e) => {
                const num = Number(e.target.value);
                const ward = getWardByNumber(num);
                if (ward) {
                  setLocation({
                    status: 'ready',
                    latitude: ward.lat,
                    longitude: ward.lng,
                    address: null,
                    wardNum: ward.num,
                    source: 'manual',
                  });
                }
              }}
              className="mt-2 w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13px] font-semibold text-ink outline-none focus:border-sky"
            >
              <option value="">Or select your ward manually</option>
              {NASHIK_WARDS.map((w) => (
                <option key={w.num} value={w.num}>
                  Ward {w.num} — {w.name}
                </option>
              ))}
            </select>
            <Link
              href="/map"
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line bg-card py-2.5 text-[12px] font-bold text-sky transition hover:border-sky"
            >
              <MapIcon size={14} /> Report from Map — pick your ward manually
            </Link>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">3. Category</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const { color, bg } = CATEGORY_STYLE[cat];
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                      active ? 'border-sky ring-2 ring-sky/30' : 'border-line hover:border-sky/50'
                    }`}
                    style={{ backgroundColor: active ? bg : '#FFFFFF' }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg, color }}>
                      <Icon size={18} />
                    </span>
                    <span className="text-[12px] font-bold text-ink">{CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nearby duplicates */}
          {nearby.length > 0 && (
            <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3.5">
              <p className="text-[13px] font-bold text-ink">
                {nearby.length} similar report{nearby.length === 1 ? '' : 's'} found nearby
              </p>
              <p className="mt-0.5 text-[12px] text-muted">
                If this is the same problem, support an existing report instead of creating a duplicate.
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {nearby.map((issue) => (
                  <li key={issue.id} className="flex items-center gap-2 rounded-lg border border-line bg-card p-2">
                    <a href={`/issue/${issue.id}`} className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink hover:underline">
                      {issue.title}
                    </a>
                    <VoteButton issueId={issue.id} initialUpvotes={issue.upvotes} size="sm" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] font-semibold text-[#B91C1C]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky py-3.5 text-[14px] font-bold text-white shadow-lg shadow-sky/30 transition hover:bg-sky/90 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
