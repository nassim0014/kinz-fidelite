import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Affiche' };

export default async function PosterPage() {
  if (!(await getPageSession())) redirect('/staff/login');
  const svg = await qrSvg(`${env().APP_URL}/rejoindre`);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <p className="font-display text-5xl tracking-widest">KINZ</p>
      <h1 className="font-display text-3xl">Votre carte de fidélité</h1>
      <div className="w-72" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="text-lg">Scannez, créez votre carte en 30 secondes.</p>
      <ul className="text-sm">
        <li>1 tampon par visite dès 40 TND · 2 dès 120 TND · 3 dès 300 TND</li>
        <li>Récompenses aux paliers 3 · 5 · 7 · 11 · 13</li>
        <li>50 niveaux à gravir — la suite de Fibonacci multiplie vos pépins</li>
      </ul>
      <p className="no-print mt-4 text-sm text-muted">Pour imprimer : Ctrl/Cmd + P</p>
    </main>
  );
}
