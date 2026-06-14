'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Trash2, ShieldCheck, ExternalLink, Settings } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { ADMIN_AUTH_KEY } from '@/lib/admin';
import { timeAgo, wardLabel } from '@/lib/format';
import { CATEGORY_LABELS, Comment, Issue } from '@/types';

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'issues' | 'comments'>('issues');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem(ADMIN_AUTH_KEY) !== 'true') {
      router.replace('/login');
      return;
    }
    setAuthed(true);
  }, [router]);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    (async () => {
      const [{ data: issuesData }, { data: commentsData }] = await Promise.all([
        supabase.from('issues').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (cancelled) return;
      setIssues((issuesData as Issue[]) ?? []);
      setComments((commentsData as Comment[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  const deleteIssue = async (id: string) => {
    if (!confirm('Delete this issue and all its comments/updates/votes?')) return;
    const { error } = await supabase.from('issues').delete().eq('id', id);
    if (!error) setIssues((current) => current.filter((i) => i.id !== id));
  };

  const deleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) setComments((current) => current.filter((c) => c.id !== id));
  };

  const logout = () => {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    router.push('/login');
  };

  if (!authed) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-sky" />
            <h1 className="text-xl font-extrabold text-ink">Moderation</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[12px] font-bold text-ink transition hover:border-sky hover:text-sky"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('issues')}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              tab === 'issues' ? 'bg-sky text-white' : 'border border-line bg-card text-muted'
            }`}
          >
            Issues ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
              tab === 'comments' ? 'bg-sky text-white' : 'border border-line bg-card text-muted'
            }`}
          >
            Comments ({comments.length})
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-[13px] text-muted">Loading…</p>
        ) : tab === 'issues' ? (
          issues.length === 0 ? (
            <p className="mt-6 text-[13px] text-muted">No issues found.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#E0F2FE]">
                    <Image src={issue.before_photo_url} alt={issue.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">{issue.title}</p>
                    <p className="truncate text-[11px] text-muted">
                      {CATEGORY_LABELS[issue.category]}
                      {wardLabel(issue.ward_id) ? ` · ${wardLabel(issue.ward_id)}` : ''} ·{' '}
                      {issue.reporter_name ?? 'Anonymous'} · {timeAgo(issue.created_at)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/issue/${issue.id}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-sky hover:text-sky"
                    aria-label="Manage issue"
                  >
                    <Settings size={15} />
                  </Link>
                  <Link
                    href={`/issue/${issue.id}`}
                    target="_blank"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition hover:border-sky hover:text-sky"
                    aria-label="View issue"
                  >
                    <ExternalLink size={15} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteIssue(issue.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                    aria-label="Delete issue"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : comments.length === 0 ? (
          <p className="mt-6 text-[13px] text-muted">No comments found.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-xl border border-line bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-ink">{c.display_name ?? c.citizen?.name ?? 'Citizen'}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{c.text}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    <Link href={`/issue/${c.issue_id}`} target="_blank" className="font-bold text-sky hover:underline">
                      View issue
                    </Link>{' '}
                    · {timeAgo(c.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteComment(c.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] transition hover:bg-[#FEE2E2]"
                  aria-label="Delete comment"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
