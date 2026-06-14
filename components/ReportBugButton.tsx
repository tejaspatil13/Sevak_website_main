'use client';

import { useState } from 'react';
import { Bug, Instagram, Mail, X } from 'lucide-react';

const SUPPORT_EMAIL = 'tejaspatil9284@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/tejas.patil_13?igsh=aG8zOTVlZThtb3Fo&utm_source=qr';

export function ReportBugButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-full bg-sky px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-sky/90'
        }
      >
        <Bug size={14} /> Report Bug
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0F2FE] text-sky">
                <Bug size={20} />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-muted transition hover:bg-bg hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-3 text-[16px] font-extrabold text-ink">Found a bug?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Facing any issue with the app? Email us here, we&apos;ll fix it in 24 hours.
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-sky px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-sky/90"
            >
              <Mail size={15} /> {SUPPORT_EMAIL}
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-bg"
            >
              <Instagram size={15} /> Follow us on Instagram
            </a>
          </div>
        </div>
      )}
    </>
  );
}
