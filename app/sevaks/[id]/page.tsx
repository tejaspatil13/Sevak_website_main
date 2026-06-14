import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, ArrowRight, FileText } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { getCorporator } from '@/lib/corporators';
import { getIssues } from '@/lib/data';
import { PARTY_ACCENT } from '@/types';
import { initials, wardNumber } from '@/lib/format';

export default async function CorporatorProfilePage({ params }: { params: { id: string } }) {
  const srNo = Number(params.id);
  const corporator = getCorporator(srNo);
  if (!corporator) notFound();

  const allIssues = await getIssues({ limit: 150 });
  const wardIssues = allIssues.filter((issue) => wardNumber(issue.ward_id) === corporator.wardNo);

  const accent = PARTY_ACCENT[corporator.party] || '#F97316';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="bg-navy">
        <div className="h-[2px] w-full" style={{ backgroundColor: accent }} />
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full text-[24px] font-black"
              style={{ backgroundColor: `${accent}33`, color: accent }}
            >
              {initials(corporator.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                {corporator.name}
              </h1>
              <p className="mt-0.5 text-[12px] text-white/65">Corporator · NMC</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${accent}33`, borderColor: `${accent}66`, color: accent }}
                >
                  {corporator.party}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-[#BAE6FD] bg-[#E0F2FE] px-2 py-0.5 text-[10px] font-bold text-sky">
                  <MapPin size={10} /> Ward {corporator.wardNo} · Seat {corporator.seat}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Issues in Ward {corporator.wardNo}
          </p>
          <span className="text-[12px] font-semibold text-muted">
            {wardIssues.length} issue{wardIssues.length === 1 ? '' : 's'}
          </span>
        </div>

        {wardIssues.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-6 py-10 text-center">
            <FileText size={28} className="text-sky" />
            <p className="text-[13px] font-bold text-ink">No issues reported in this ward yet</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {wardIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        <Link
          href="/map"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-sky/90"
        >
          View Ward {corporator.wardNo} on Map <ArrowRight size={15} />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
