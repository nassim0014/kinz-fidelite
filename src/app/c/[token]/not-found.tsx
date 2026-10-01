import Link from 'next/link';
import { KinzLogo } from '@/components/brand/KinzLogo';

export default function CardNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 pt-14 pb-12 text-center">
      <KinzLogo className="mx-auto h-8 w-auto text-forest" />
      <h1 className="mt-10 font-display text-3xl text-forest">Carte introuvable</h1>
      <p className="mt-3 text-muted">
        Ce lien ne correspond à aucune carte. Demandez au comptoir de vous renvoyer la vôtre par
        WhatsApp ou SMS.
      </p>
      <Link
        href="/rejoindre?nouveau=1"
        className="mt-8 inline-block rounded-full bg-forest px-6 py-3 font-bold text-lime"
      >
        Créer une carte
      </Link>
    </main>
  );
}
