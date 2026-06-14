'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from '@/lib/admin';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      router.push('/admin');
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0F2FE] text-sky">
          <ShieldCheck size={24} />
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-ink">Developer Portal</h1>
        <p className="mt-1 text-center text-[13px] text-muted">Sign in to moderate issues and comments.</p>

        <form onSubmit={onSubmit} className="mt-6 flex w-full flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-3">
            <Lock size={16} className="text-muted" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none"
            />
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#B91C1C]">
              <AlertTriangle size={13} /> {error}
            </p>
          )}
          <button
            type="submit"
            className="rounded-xl bg-sky py-3 text-[14px] font-bold text-white transition hover:bg-sky/90"
          >
            Sign In
          </button>
        </form>
      </section>

      <Footer />
    </div>
  );
}
