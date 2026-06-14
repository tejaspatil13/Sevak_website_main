'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton({ title, url, size = 'md' }: { title: string; url?: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);

  const onShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = !url ? window.location.href : url.startsWith('http') ? url : `${window.location.origin}${url}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const padding = size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-2 text-[13px]';
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <button
      type="button"
      onClick={onShare}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-card font-bold text-muted transition hover:border-sky hover:text-sky ${padding}`}
    >
      {copied ? <Check size={iconSize} /> : <Share2 size={iconSize} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}
