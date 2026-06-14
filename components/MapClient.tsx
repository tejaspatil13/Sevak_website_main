'use client';

import dynamic from 'next/dynamic';
import { MapIssue } from '@/lib/data';

const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="isolate flex h-[70vh] min-h-[420px] w-full items-center justify-center rounded-xl border border-line text-[13px] font-semibold text-muted">
      Loading map…
    </div>
  ),
});

export function MapClient({ issues }: { issues: MapIssue[] }) {
  return <MapView issues={issues} />;
}
