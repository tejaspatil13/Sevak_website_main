'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export function CommentButton({
  issueId,
  count = 0,
  size = 'md',
}: {
  issueId: string;
  count?: number;
  size?: 'sm' | 'md';
}) {
  const router = useRouter();
  const padding = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-2 text-[13px]';

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/issue/${issueId}#comments`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-card font-bold text-muted transition hover:border-sky hover:text-sky ${padding}`}
    >
      <MessageCircle size={size === 'sm' ? 16 : 18} /> {count} {count === 1 ? 'Comment' : 'Comments'}
    </button>
  );
}
