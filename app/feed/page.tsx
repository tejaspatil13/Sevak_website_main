import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeedClient } from '@/components/FeedClient';
import { getIssues } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const issues = await getIssues({ limit: 150 });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <FeedClient issues={issues} />
      </section>

      <Footer />
    </div>
  );
}
