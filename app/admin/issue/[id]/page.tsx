'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Camera, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryChip } from '@/components/CategoryChip';
import { StatusTimeline } from '@/components/StatusTimeline';
import { supabase } from '@/lib/supabase';
import { ADMIN_AUTH_KEY } from '@/lib/admin';
import { getIssue, getIssueUpdates } from '@/lib/data';
import { timeAgo, wardLabel } from '@/lib/format';
import { Issue, IssueStatus, IssueUpdate, STATUS_LABELS } from '@/types';

const STATUS_OPTIONS: IssueStatus[] = ['pending', 'escalated', 'accepted', 'in_progress', 'resolved', 'rejected'];

export default function AdminIssuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [updates, setUpdates] = useState<IssueUpdate[]>([]);

  const [status, setStatus] = useState<IssueStatus>('pending');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const [issueData, updatesData] = await Promise.all([getIssue(params.id), getIssueUpdates(params.id)]);
      if (cancelled) return;
      setIssue(issueData);
      setUpdates(updatesData);
      if (issueData) setStatus(issueData.status);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, params.id]);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `updates/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('issue-photos')
          .upload(path, photoFile, { contentType: photoFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('issue-photos').getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const trimmedTitle = title.trim();
      const trimmedDetail = detail.trim();
      const note = trimmedTitle
        ? `**${trimmedTitle}**${trimmedDetail ? `\n${trimmedDetail}` : ''}`
        : trimmedDetail || null;

      const { data: updateRow, error: insertError } = await supabase
        .from('issue_updates')
        .insert({ issue_id: issue.id, updated_by: null, status, note, photo_url: photoUrl })
        .select('*')
        .single();
      if (insertError) throw insertError;

      const patch: Partial<Issue> = { status };
      if (status === 'accepted' && !issue.accepted_at) patch.accepted_at = new Date().toISOString();
      if (status === 'resolved') {
        patch.resolved_at = new Date().toISOString();
        if (photoUrl) patch.after_photo_url = photoUrl;
      }

      const { error: updateError } = await supabase.from('issues').update(patch).eq('id', issue.id);
      if (updateError) throw updateError;

      setIssue((current) => (current ? { ...current, ...patch } : current));
      setUpdates((current) => [...current, updateRow as IssueUpdate]);
      setTitle('');
      setDetail('');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post update. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authed || loading) return null;
  if (!issue) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
          <p className="text-[13px] text-muted">Issue not found.</p>
          <Link href="/admin" className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-sky">
            <ArrowLeft size={14} /> Back to Moderation
          </Link>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-sky">
          <ArrowLeft size={14} /> Back to Moderation
        </Link>

        <div className="mt-4 flex items-center gap-2">
          <ShieldCheck size={20} className="text-sky" />
          <h1 className="text-xl font-extrabold text-ink">Manage Issue</h1>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-line bg-card p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#E0F2FE]">
            <Image src={issue.before_photo_url} alt={issue.title} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-ink">{issue.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <CategoryChip category={issue.category} />
              {wardLabel(issue.ward_id) && (
                <span className="text-[11px] text-muted">{wardLabel(issue.ward_id)}</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Reported by {issue.reporter_name ?? 'Anonymous Citizen'} · {timeAgo(issue.created_at)}
            </p>
            <p className="mt-1 text-[12px] font-bold text-ink">
              Current status: {STATUS_LABELS[issue.status]}
            </p>
          </div>
        </div>

        {issue.after_photo_url && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">After Photo</p>
            <div className="relative h-[160px] w-full overflow-hidden rounded-xl">
              <Image src={issue.after_photo_url} alt="After" fill className="object-cover" unoptimized />
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-line bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted">Progress</p>
          <StatusTimeline issue={issue} updates={updates} />
        </div>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 rounded-xl border border-line bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Post an Update</p>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-sky"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Update Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Team dispatched to site"
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">Details</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What's being done about this issue..."
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-sky"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted">
              Photo {status === 'resolved' ? '(resolved photo, shown to all citizens)' : '(optional)'}
            </label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="relative mt-1.5 block aspect-video w-full overflow-hidden rounded-lg border border-line"
              >
                <Image src={photoPreview} alt="Selected photo" fill className="object-cover" unoptimized />
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white">
                  Change photo
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line bg-bg py-6 text-muted transition hover:border-sky hover:text-sky"
              >
                <Camera size={20} />
                <span className="text-[13px] font-bold">Upload a photo</span>
              </button>
            )}
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] font-semibold text-[#B91C1C]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky py-3 text-[14px] font-bold text-white transition hover:bg-sky/90 disabled:opacity-60"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Posting…' : 'Post Update'}
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
