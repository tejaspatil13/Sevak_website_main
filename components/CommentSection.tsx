'use client';

import { useState } from 'react';
import { MessageCircle, MessagesSquare, Send, Loader2, CornerDownRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAnonIdentity } from '@/lib/anon';
import { avatarColor, initials, timeAgo } from '@/lib/format';
import { Comment } from '@/types';

export function CommentSection({ issueId, initialComments }: { issueId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({ issue_id: issueId, citizen_id: null, parent_id: null, display_name: getAnonIdentity().name, text: trimmed })
      .select('id, issue_id, citizen_id, parent_id, display_name, text, created_at')
      .single();

    if (insertError || !data) {
      setError('Could not post your comment. Please try again.');
    } else {
      setComments((current) => [...current, data as Comment]);
      setText('');
    }
    setSubmitting(false);
  };

  const onSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || replySubmitting) return;

    setReplySubmitting(true);

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({ issue_id: issueId, citizen_id: null, parent_id: parentId, display_name: getAnonIdentity().name, text: trimmed })
      .select('id, issue_id, citizen_id, parent_id, display_name, text, created_at')
      .single();

    if (!insertError && data) {
      setComments((current) => [...current, data as Comment]);
      setReplyText('');
      setReplyingTo(null);
    }
    setReplySubmitting(false);
  };

  const renderComment = (c: Comment, isReply = false) => {
    const name = c.display_name ?? c.citizen?.name ?? 'Citizen';
    return (
      <div className="flex gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
            isReply ? 'h-7 w-7' : 'h-8 w-8'
          }`}
          style={{ backgroundColor: avatarColor(name) }}
        >
          {initials(name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px]">
            <span className="font-bold text-ink">{name}</span>{' '}
            <span className="text-[11px] text-muted">{timeAgo(c.created_at)}</span>
          </p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{c.text}</p>
          {!isReply && (
            <button
              type="button"
              onClick={() => {
                setReplyingTo((current) => (current === c.id ? null : c.id));
                setReplyText('');
              }}
              className="mt-1 flex items-center gap-1 text-[11px] font-bold text-muted hover:text-sky"
            >
              <CornerDownRight size={12} /> Reply
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="comments" className="mt-5 overflow-hidden rounded-xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <MessageCircle size={18} className="text-navy" />
        <span className="text-[13px] font-bold text-ink">Comments</span>
        <span className="rounded-full bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-bold text-sky">
          {comments.length}
        </span>
      </div>

      {topLevel.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <MessagesSquare size={28} className="text-line" />
          <p className="text-[13px] text-muted">No comments yet. Be the first!</p>
        </div>
      ) : (
        <ul>
          {topLevel.map((c) => (
            <li key={c.id} className="border-b border-line px-4 py-3 last:border-b-0">
              {renderComment(c)}

              {repliesOf(c.id).length > 0 && (
                <ul className="mt-3 flex flex-col gap-3 border-l border-line pl-3">
                  {repliesOf(c.id).map((r) => (
                    <li key={r.id}>{renderComment(r, true)}</li>
                  ))}
                </ul>
              )}

              {replyingTo === c.id && (
                <form onSubmit={(e) => onSubmitReply(e, c.id)} className="mt-3 flex items-center gap-2 pl-3">
                  <input
                    type="text"
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${c.display_name ?? c.citizen?.name ?? 'Citizen'}…`}
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-full border border-line bg-bg px-3.5 py-1.5 text-[12px] text-ink outline-none focus:border-sky"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || replySubmitting}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-white transition disabled:opacity-50"
                  >
                    {replySubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-muted transition hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-line bg-bg px-3.5 py-2 text-[13px] text-ink outline-none focus:border-sky"
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky text-white transition disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      {error && <p className="px-4 pb-3 text-[12px] font-semibold text-[#B91C1C]">{error}</p>}
    </div>
  );
}
