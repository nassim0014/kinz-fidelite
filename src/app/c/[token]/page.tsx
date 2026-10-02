import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AddressForm } from '@/components/card/AddressForm';
import { AutoRefresh } from '@/components/card/AutoRefresh';
import { BirthdayBanner } from '@/components/card/BirthdayBanner';
import { HowItWorks } from '@/components/card/HowItWorks';
import { LevelPanel } from '@/components/card/LevelPanel';
import { LoyaltyCard } from '@/components/card/LoyaltyCard';
import { PerkList } from '@/components/card/PerkList';
import { RememberCard } from '@/components/card/RememberCard';
import { getDb } from '@/db/client';
import { env } from '@/lib/env';
import { qrSvg } from '@/lib/qr';
import { isCardToken } from '@/lib/token';
import { buildCardView } from '@/lib/views';
import { getCustomerByToken } from '@/server/customers';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return {
    title: 'Ma carte',
    ...(isCardToken(token) ? { manifest: `/c/${token}/manifest.webmanifest` } : {}),
  };
}

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const customer = await getCustomerByToken(getDb(), token);
  if (!customer) notFound();
  const view = buildCardView(customer);
  const svg = await qrSvg(`${env().APP_URL}/c/${token}`);

  return (
    <main className="mx-auto max-w-md space-y-7 px-4 pt-6 pb-12">
      <h1 className="px-1 font-display text-3xl text-forest">Bonjour {view.firstName}</h1>
      <BirthdayBanner perk={view.birthdayPerk} />
      <LoyaltyCard cardStamps={view.cardStamps} qrSvg={svg} />
      <LevelPanel view={view} />
      {view.needsAddress && <AddressForm token={token} />}
      <PerkList view={view} />
      <HowItWorks />
      <p className="px-1 text-center text-xs text-muted">
        Ajoutez cette page à votre écran d’accueil pour retrouver votre carte en un geste.
      </p>
      <RememberCard token={token} />
      <AutoRefresh token={token} />
    </main>
  );
}
