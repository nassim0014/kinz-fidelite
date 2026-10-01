import { redirect } from 'next/navigation';
import { KinzLogo } from '@/components/brand/KinzLogo';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Affiche' };

export default async function PosterPage() {
  if (!(await getPageSession())) redirect('/staff/login');
  const svg = await qrSvg(`${env().APP_URL}/rejoindre`);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 bg-white p-8 text-center text-forest">
      <KinzLogo variant="full" className="h-40 w-auto" />
      <h1 className="mt-2 font-display text-3xl">Votre carte de fidélité</h1>
      <div className="w-72" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-lg text-ink">Scannez et créez votre carte en 30 secondes.</p>
      <ul className="space-y-1 text-sm text-ink">
        <li>1 tampon dès 40 TND d’achat, 2 dès 120 TND, 3 dès 300 TND</li>
        <li>Des récompenses à 2, 3, 5, 7, 11, 13… à vous de deviner la suite</li>
        <li>50 niveaux, et des pépins qui se multiplient en chemin</li>
      </ul>
      <p className="no-print mt-4 text-sm text-muted">Pour imprimer : Ctrl/Cmd + P</p>
    </main>
  );
}
