import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Navigation, ChevronRight, MessageCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryChip } from '@/components/CategoryChip';
import { StatusBadge } from '@/components/StatusBadge';
import { VoteButton } from '@/components/VoteButton';
import { ShareButton } from '@/components/ShareButton';
import { StatusTimeline } from '@/components/StatusTimeline';
import { CommentSection } from '@/components/CommentSection';
import { getIssue, getIssueUpdates, getIssueComments } from '@/lib/data';
import { getCorporatorsByWard } from '@/lib/corporators';
import { initials, wardLabel, wardNumber } from '@/lib/format';
import { PARTY_ACCENT } from '@/types';

export const revalidate = 30;

export default async function IssueDetailPage({ params }: { params: { id: string } }) {
  const issue = await getIssue(params.id);
  if (!issue) notFound();

  const [updates, comments] = await Promise.all([
    getIssueUpdates(issue.id),
    getIssueComments(issue.id),
  ]);

  const mapsUrl = `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}`;

  const wardNum = wardNumber(issue.ward_id);
  const wardSevaks = wardNum ? getCorporatorsByWard(wardNum) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="relative h-[280px] w-full bg-[#E0F2FE] sm:h-[360px]">
        <Image src={issue.before_photo_url} alt={issue.title} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute right-4 top-4">
          <StatusBadge issue={issue} />
        </span>
      </div>

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <CategoryChip category={issue.category} />
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{issue.title}</h1>
          {issue.description && (
            <p className="text-[13px] leading-relaxed text-muted">{issue.description}</p>
          )}
          <p className="text-[12px] text-muted">Reported by {issue.reporter_name ?? 'Anonymous Citizen'}</p>
        </div>

        {issue.location_address && (
          <div className="mt-5 rounded-xl border border-line bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0F2FE] text-sky">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Location</p>
                <p className="mt-0.5 text-[13px] font-medium text-ink">{issue.location_address}</p>
                {wardLabel(issue.ward_id) && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#E0F2FE] px-2.5 py-1 text-[12px] font-extrabold text-sky">
                    <MapPin size={14} /> {wardLabel(issue.ward_id)}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2.5">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#BFDBFE] bg-[#EFF6FF] py-2.5 text-[13px] font-bold text-sky"
              >
                <MapPin size={15} /> View on Map
              </a>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[#A7F3D0] bg-[#ECFDF5] py-2.5 text-[13px] font-bold text-[#059669]"
              >
                <Navigation size={15} /> Get Directions
              </a>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <VoteButton issueId={issue.id} initialUpvotes={issue.upvotes} />
          <a
            href="#comments"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-2 text-[13px] font-bold text-muted transition hover:border-sky hover:text-sky"
          >
            <MessageCircle size={16} /> {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </a>
          <ShareButton title={issue.title} />
        </div>

        <div className="mt-5 rounded-xl border border-line bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Progress</p>
          <StatusTimeline issue={issue} updates={updates} />
        </div>

        {wardSevaks.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#FED7AA] bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Assigned Sevaks · Ward {wardNum}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              These corporators are responsible for resolving issues in this ward.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {wardSevaks.map((sevak) => {
                const accent = PARTY_ACCENT[sevak.party] || '#F97316';
                return (
                  <Link
                    key={sevak.srNo}
                    href={`/sevaks/${sevak.srNo}`}
                    className="flex items-center gap-3 rounded-lg border border-line p-2.5 transition hover:shadow-card"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold"
                      style={{ backgroundColor: `${accent}26`, color: accent }}
                    >
                      {initials(sevak.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold text-ink">{sevak.name}</p>
                      <p className="text-[11px] text-muted">Seat {sevak.seat} · {sevak.party}</p>
                    </div>
                    <ChevronRight size={18} className="text-[#9CA3AF]" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {issue.status === 'resolved' && issue.after_photo_url && (
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">After Photo</p>
            <div className="relative h-[200px] w-full overflow-hidden rounded-xl">
              <Image src={issue.after_photo_url} alt="After" fill className="object-cover" unoptimized />
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentSection issueId={issue.id} initialComments={comments} />
      </section>

      <Footer />
    </div>
  );
}
