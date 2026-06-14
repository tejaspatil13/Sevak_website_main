import { Issue, IssueUpdate, STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from '@/types';
import { formatDate, parseNote } from '@/lib/format';

export function StatusTimeline({ issue, updates }: { issue: Issue; updates: IssueUpdate[] }) {
  const currentIndex = STATUS_ORDER.indexOf(
    issue.status === 'rejected' ? 'pending' : issue.status
  );

  const updatesByStatus = new Map<string, IssueUpdate[]>();
  for (const u of updates) {
    const list = updatesByStatus.get(u.status) ?? [];
    list.push(u);
    updatesByStatus.set(u.status, list);
  }

  return (
    <div className="flex flex-col">
      {STATUS_ORDER.map((status, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const isLast = i === STATUS_ORDER.length - 1 && issue.status !== 'rejected';
        const stepUpdates = updatesByStatus.get(status) ?? [];

        return (
          <div key={status} className="flex min-h-[56px]">
            <div className="flex w-8 flex-col items-center">
              <div
                className={`mt-1 h-3.5 w-3.5 rounded-full border-2 transition-transform ${
                  active ? 'scale-[1.2]' : ''
                }`}
                style={{
                  backgroundColor: done ? STATUS_COLORS[status] : 'transparent',
                  borderColor: done ? STATUS_COLORS[status] : '#E5E7EB',
                }}
              />
              {!isLast && (
                <div
                  className="my-1 w-0.5 flex-1"
                  style={{
                    backgroundColor: i < currentIndex ? STATUS_COLORS[STATUS_ORDER[i + 1]] : '#E5E7EB',
                  }}
                />
              )}
            </div>
            <div className="flex-1 pb-4 pl-3">
              <p
                className="text-[13px] font-bold"
                style={{ color: done ? '#1A1A2E' : '#9CA3AF' }}
              >
                {STATUS_LABELS[status]}
              </p>
              {stepUpdates.map((u) => {
                const { heading, detail } = parseNote(u.note);
                return (
                  <div key={u.id} className="mt-1">
                    <p className="text-[11px] tabular-nums text-muted">{formatDate(u.created_at)}</p>
                    {heading && <p className="mt-0.5 text-[12px] font-bold text-ink">{heading}</p>}
                    {detail && (
                      <p className="mt-1 rounded bg-[#F5F7FA] px-2 py-1 text-[12px] leading-snug text-ink">
                        {detail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {issue.status === 'rejected' && (
        <div className="flex min-h-[56px]">
          <div className="flex w-8 flex-col items-center">
            <div
              className="mt-1 h-3.5 w-3.5 scale-[1.2] rounded-full"
              style={{ backgroundColor: STATUS_COLORS.rejected }}
            />
          </div>
          <div className="flex-1 pb-4 pl-3">
            <p className="text-[13px] font-bold" style={{ color: STATUS_COLORS.rejected }}>
              {STATUS_LABELS.rejected}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
