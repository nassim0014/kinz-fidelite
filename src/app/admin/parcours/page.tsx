import { redirect } from 'next/navigation';
import { RoadmapPoster } from '@/components/roadmap/RoadmapPoster';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Parcours A3' };

export default async function JourneyPosterPage() {
  if (!(await getPageSession())) redirect('/staff/login');
  const svg = await qrSvg(`${env().APP_URL}/rejoindre`);
  return (
    <main className="py-8 print:py-0">
      <p className="no-print mb-6 text-center text-sm text-muted">
        Affiche A3 à encadrer. Pour imprimer : Ctrl/Cmd + P, format A3, marges aucune.
      </p>
      <RoadmapPoster qrSvg={svg} />
    </main>
  );
}
