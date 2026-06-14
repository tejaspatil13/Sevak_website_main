import Link from 'next/link';
import { SevakLogo } from './SevakLogo';
import { MobileNav } from './MobileNav';
import { ReportBugButton } from './ReportBugButton';

const NAV_LINKS = [
  { href: '/map', label: 'Map' },
  { href: '/escalated', label: 'Escalated' },
  { href: '/sevaks', label: 'Sevaks' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-navy shadow-sm">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <SevakLogo size={32} />
          <span className="text-[17px] font-black tracking-[0.3em] text-white">SEVAK</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex sm:gap-1.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-white/85 transition hover:bg-white/10 hover:text-white sm:px-3.5"
            >
              {link.label}
            </Link>
          ))}
          <ReportBugButton className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-sky px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-sky/90" />
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <ReportBugButton className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-sky/90" />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
