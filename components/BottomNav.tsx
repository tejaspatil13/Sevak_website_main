'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, Map, Plus, Users, Flame } from 'lucide-react';

const ITEMS = [
  { href: '/feed', label: 'Feed', icon: Newspaper },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/report', label: 'Report', icon: Plus },
  { href: '/sevaks', label: 'Sevaks', icon: Users },
  { href: '/escalated', label: 'Escalated', icon: Flame },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname?.startsWith(`${href}/`));
          const isReport = href === '/report';

          if (isReport) {
            return (
              <Link
                key={href}
                href={href}
                className="relative z-10 flex flex-col items-center justify-center gap-1 py-2"
              >
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-card bg-sky text-white shadow-lg shadow-sky/40 transition active:scale-95">
                  <Icon size={22} strokeWidth={2.5} />
                </span>
                <span className={`text-[10px] font-bold ${active ? 'text-sky' : 'text-muted'}`}>{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 ${active ? 'text-sky' : 'text-muted'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
