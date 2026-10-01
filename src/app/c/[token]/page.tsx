import { notFound } from 'next/navigation';
import { AddressForm } from '@/components/card/AddressForm';
import { AutoRefresh } from '@/components/card/AutoRefresh';
import { LevelPanel } from '@/components/card/LevelPanel';
import { PerkList } from '@/components/card/PerkList';
import { RememberCard } from '@/components/card/RememberCard';
import { StampTrack } from '@/components/card/StampTrack';
import { getDb } from '@/db/client';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { buildCardView } from '@/lib/views';
import { getCustomerByToken } from '@/server/customers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ma carte' };

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const customer = await getCustomerByToken(getDb(), token);
  if (!customer) notFound();
  const view = buildCardView(customer);
  const svg = await qrSvg(`${env().APP_URL}/c/${token}`);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-6">
      <header className="text-center">
        <p className="font-display text-3xl tracking-widest">KINZ</p>
        <h1 className="mt-1 text-lg">Bonjour {view.firstName}</h1>
      </header>
      <section className="rounded-2xl bg-white p-4 text-center shadow-sm">
        <div
          className="mx-auto w-56"
          aria-label="QR code de votre carte"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <p className="mt-2 text-sm text-muted">
          Présentez ce code au comptoir après un achat d’au moins 40 TND.
        </p>
      </section>
      <StampTrack cardStamps={view.cardStamps} />
      <LevelPanel view={view} />
      {view.needsAddress && <AddressForm token={token} />}
      <PerkList view={view} />
      <p className="text-center text-xs text-muted">
        Astuce : ajoutez cette page à votre écran d’accueil pour retrouver votre carte.
      </p>
      <RememberCard token={token} />
      <AutoRefresh />
    </main>
  );
}
