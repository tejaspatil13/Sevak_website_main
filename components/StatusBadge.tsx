import { Issue, STATUS_BADGE, STATUS_LABELS } from '@/types';

export function StatusBadge({ issue }: { issue: Pick<Issue, 'status'> }) {
  const { bg, color, dot } = STATUS_BADGE[issue.status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: bg, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {STATUS_LABELS[issue.status]}
    </span>
  );
}
