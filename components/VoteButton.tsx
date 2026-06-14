'use client';

import { useEffect, useState } from 'react';
import { ArrowUpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { hasVoted, markVoted } from '@/lib/votes';

export function VoteButton({
  issueId,
  initialUpvotes,
  size = 'md',
}: {
  issueId: string;
  initialUpvotes: number;
  size?: 'sm' | 'md';
}) {
  const [count, setCount] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);
  const [pending, setPending] = useState(false);

  // Read localStorage after mount only — reading during render would mismatch
  // the server-rendered HTML and trigger a hydration error.
  useEffect(() => {
    setVoted(hasVoted(issueId));
  }, [issueId]);

  const onVote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (voted || pending) return;

    setPending(true);
    setVoted(true);
    setCount((c) => c + 1);

    const { error } = await supabase.rpc('increment_issue_upvote', { p_issue_id: issueId });
    if (error) {
      // roll back optimistic update if the RPC isn't set up yet / failed
      setCount((c) => c - 1);
      setVoted(false);
    } else {
      markVoted(issueId);
    }
    setPending(false);
  };

  const padding = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-2 text-[13px]';

  return (
    <button
      type="button"
      onClick={onVote}
      disabled={voted}
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold transition ${padding} ${
        voted
          ? 'border-[#BFDBFE] bg-[#EFF6FF] text-sky'
          : 'border-line bg-card text-muted hover:border-sky hover:text-sky'
      }`}
    >
      <ArrowUpCircle size={size === 'sm' ? 16 : 18} />
      {count} {voted ? 'Upvoted' : 'Upvote'}
    </button>
  );
}
