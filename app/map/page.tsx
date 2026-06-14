import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MapClient } from '@/components/MapClient';
import { getMapIssues } from '@/lib/data';

export const revalidate = 30;

export default async function MapPage() {
  const issues = await getMapIssues();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6">
        <MapClient issues={issues} />
      </section>

      <Footer />
    </div>
  );
}
