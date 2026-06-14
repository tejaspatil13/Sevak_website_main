import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { Corporator } from '@/lib/corporators';
import { PARTY_ACCENT } from '@/types';
import { initials } from '@/lib/format';

export function CorporatorCard({ corporator }: { corporator: Corporator }) {
  const accent = PARTY_ACCENT[corporator.party] || '#6B7280';

  return (
    <Link
      href={`/sevaks/${corporator.srNo}`}
      className="mb-3 block overflow-hidden rounded-xl border border-line bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: accent }} />
      <div className="flex items-center gap-3.5 p-3.5">
        <div
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-[16px] font-extrabold"
          style={{ backgroundColor: `${accent}26`, color: accent }}
        >
          {initials(corporator.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-extrabold tracking-tight text-ink">{corporator.name}</h3>
          <p className="text-[12px] text-muted">Corporator · NMC</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#BAE6FD] bg-[#E0F2FE] px-2 py-0.5 text-[10px] font-bold text-sky">
              <MapPin size={10} /> Ward {corporator.wardNo} · Seat {corporator.seat}
            </span>
            <span
              className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: `${accent}1F`, borderColor: `${accent}59`, color: accent }}
            >
              {corporator.party}
            </span>
          </div>
        </div>
        <ChevronRight size={18} className="shrink-0 text-[#9CA3AF]" />
      </div>
    </Link>
  );
}
