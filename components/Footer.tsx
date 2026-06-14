import Link from 'next/link';
import { SevakLogo } from './SevakLogo';

export function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
              <SevakLogo size={28} variant="dark" />
              <span className="text-[15px] font-black tracking-[0.3em] text-navy">SEVAK</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
              Built by citizens, for citizens. A user-first app — post your complaint here and
              get it fixed faster than the usual process.
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">Explore</h4>
              <ul className="mt-3 space-y-2 text-[13px] font-medium text-ink">
                <li><Link href="/feed" className="hover:text-sky">Issue Feed</Link></li>
                <li><Link href="/map" className="hover:text-sky">Map</Link></li>
                <li><Link href="/escalated" className="hover:text-sky">Escalated</Link></li>
                <li><Link href="/sevaks" className="hover:text-sky">Sevaks</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted">Get Started</h4>
              <ul className="mt-3 space-y-2 text-[13px] font-medium text-ink">
                <li><Link href="/report" className="hover:text-sky">Report an issue</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-[12px] text-muted">
          © {new Date().getFullYear()} SEVAK · Built by citizens, for citizens
        </div>
      </div>
    </footer>
  );
}
