import Link from 'next/link';

export default function CardNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-2xl">Carte introuvable</h1>
      <p className="mt-2">
        Ce lien n’est pas valide. Demandez au comptoir de vous renvoyer votre carte.
      </p>
      <Link href="/rejoindre?nouveau=1" className="mt-6 inline-block underline">
        Créer une carte
      </Link>
    </main>
  );
}
