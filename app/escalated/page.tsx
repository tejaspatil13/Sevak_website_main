import { Flame, Megaphone, Clock, ShieldCheck, Activity, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IssueCard } from '@/components/IssueCard';
import { getEscalatedIssues, getIssueAnalytics } from '@/lib/data';
import { ESCALATION_THRESHOLD } from '@/types';

export const revalidate = 30;

export default async function EscalatedPage() {
  const [escalated, analytics] = await Promise.all([getEscalatedIssues(), getIssueAnalytics()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EF4444]/40 bg-[#EF4444]/15 px-3 py-1 text-[12px] font-bold text-[#FCA5A5]">
            <Flame size={13} /> {ESCALATION_THRESHOLD}+ votes
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Escalated Complaints
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#EF4444]">
            <Megaphone size={18} />
          </div>
          <p className="text-[13px] leading-relaxed text-ink">
            <span className="font-extrabold">More votes = more pressure.</span> Once an issue
            crosses {ESCALATION_THRESHOLD} votes it is automatically escalated — we reach out to
            the ward corporators to push for action. Vote for the problems that matter to you.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-[#EF4444]" />
            <h2 className="text-[16px] font-extrabold text-ink">Escalated</h2>
            <span className="text-[12px] font-semibold text-muted">{ESCALATION_THRESHOLD}+ votes</span>
            <span className="ml-auto text-[12px] font-semibold text-muted">
              {escalated.length} issue{escalated.length === 1 ? '' : 's'}
            </span>
          </div>

          {escalated.length === 0 ? (
            <p className="mt-3 rounded-xl border border-line bg-card px-4 py-6 text-center text-[13px] text-muted">
              No issue has crossed {ESCALATION_THRESHOLD} votes yet.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {escalated.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-navy" />
          <h2 className="text-[16px] font-extrabold text-ink">Ward-wise Analysis</h2>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Clock size={16} />} label="Pending" value={analytics.pending} color="#3B82F6" bg="#EFF6FF" />
          <StatCard icon={<Flame size={16} />} label="Escalated" value={analytics.escalated} color="#EF4444" bg="#FEF2F2" />
          <StatCard icon={<ShieldCheck size={16} />} label="Accepted" value={analytics.accepted} color="#6D28D9" bg="#F5F3FF" />
          <StatCard icon={<Activity size={16} />} label="In Progress" value={analytics.inProgress} color="#92400E" bg="#FFFBEB" />
          <StatCard icon={<CheckCircle2 size={16} />} label="Resolved" value={analytics.resolved} color="#065F46" bg="#ECFDF5" />
          <StatCard icon={<XCircle size={16} />} label="Rejected" value={analytics.rejected} color="#6B7280" bg="#F3F4F6" />
        </div>

        <div className="mt-6 rounded-xl border border-line bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-muted">
            <Legend color="#3B82F6" label="Pending" />
            <Legend color="#EF4444" label="Escalated" />
            <Legend color="#8B5CF6" label="In Progress / Accepted" />
            <Legend color="#10B981" label="Resolved" />
            <Legend color="#9CA3AF" label="Rejected" />
          </div>

          <div className="flex flex-col gap-3">
            {analytics.wards.map((w) => {
              const segments = [
                { value: w.pending, color: '#3B82F6' },
                { value: w.escalated, color: '#EF4444' },
                { value: w.inProgress, color: '#8B5CF6' },
                { value: w.resolved, color: '#10B981' },
                { value: w.rejected, color: '#9CA3AF' },
              ];
              return (
                <div key={w.ward} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-[12px] font-semibold text-ink">{w.ward}</span>
                  <div className="flex h-3.5 flex-1 overflow-hidden rounded-full bg-bg">
                    {segments.map((s, i) =>
                      s.value > 0 ? (
                        <div
                          key={i}
                          style={{ width: `${(s.value / w.total) * 100}%`, backgroundColor: s.color }}
                        />
                      ) : null
                    )}
                  </div>
                  <span className="w-8 shrink-0 text-right text-[12px] font-bold text-muted">{w.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: bg, color }}>
        {icon}
      </span>
      <p className="mt-2 text-xl font-black text-ink">{value}</p>
      <p className="text-[11px] font-semibold text-muted">{label}</p>
    </div>
  );
}
