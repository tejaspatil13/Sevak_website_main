import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ShieldCheck } from 'lucide-react';
import { Issue } from '@/types';
import { avatarColor, initials, timeAgo, wardLabel } from '@/lib/format';
import { CategoryChip } from './CategoryChip';
import { StatusBadge } from './StatusBadge';
import { VoteButton } from './VoteButton';
import { CommentButton } from './CommentButton';
import { ShareButton } from './ShareButton';

export function IssueCard({ issue, highlight = false }: { issue: Issue; highlight?: boolean }) {
  const reporterName = issue.reporter_name ?? issue.citizen?.name ?? 'Citizen';
  const ward = wardLabel(issue.ward_id);
  const showSevakStrip =
    issue.sevak && ['accepted', 'in_progress', 'resolved'].includes(issue.status);

  return (
    <Link
      href={`/issue/${issue.id}`}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg ${
        highlight ? 'border-sky ring-2 ring-sky/40' : 'border-line'
      }`}
    >
      {/* user row */}
      <div className="flex items-center gap-2.5 p-3 pb-2">
        <div
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-navy text-[12px] font-extrabold text-white"
          style={{ backgroundColor: avatarColor(reporterName) }}
        >
          {initials(reporterName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{reporterName}</p>
          <p className="truncate text-[11px] text-muted">
            {ward ? `${ward} · ` : ''}
            {timeAgo(issue.created_at)}
          </p>
        </div>
        <StatusBadge issue={issue} />
      </div>

      {/* photo */}
      <div className="relative aspect-video w-full bg-[#E0F2FE]">
        <Image
          src={issue.before_photo_url}
          alt={issue.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
      </div>

      {/* content */}
      <div className="flex flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-5 text-ink">{issue.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={issue.category} />
          {ward && (
            <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-[11px] font-semibold text-muted">
              <MapPin size={11} /> {ward}
            </span>
          )}
        </div>
        {issue.location_address && (
          <p className="line-clamp-1 text-[11px] text-muted">{issue.location_address}</p>
        )}

        {showSevakStrip && issue.sevak && (
          <div className="flex items-center gap-2 rounded-r-md border-l-[3px] border-navy bg-[#F0F9FF] px-2.5 py-1.5">
            <div
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-navy text-white"
              style={{ backgroundColor: avatarColor(issue.sevak.name) }}
            >
              <ShieldCheck size={12} />
            </div>
            <span className="flex-1 truncate text-[12px] font-semibold text-ink">
              {issue.sevak.name}
            </span>
            <span className="text-[11px] text-muted">handling this</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-[#F3F4F6] pt-2">
          <VoteButton issueId={issue.id} initialUpvotes={issue.upvotes} size="sm" />
          <CommentButton issueId={issue.id} size="sm" />
          <ShareButton title={issue.title} url={`/issue/${issue.id}`} size="sm" />
        </div>
      </div>
    </Link>
  );
}
