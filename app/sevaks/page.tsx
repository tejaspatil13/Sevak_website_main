import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SevaksClient } from '@/components/SevaksClient';
import { CORPORATORS } from '@/lib/corporators';

export default function SevaksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Sevak Office</h1>
          <p className="mt-1 text-[13px] text-white/65">
            All {CORPORATORS.length} elected corporators across Nashik's 31 wards.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <SevaksClient corporators={CORPORATORS} />
      </section>

      <Footer />
    </div>
  );
}
