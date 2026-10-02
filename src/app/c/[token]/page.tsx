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
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { getCopy, LOCALE_DIR, LOCALE_LANG } from '@/lib/copy';
import { getCustomerByToken } from '@/server/customers';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const customer = await getCustomerByToken(getDb(), token);
  return {
    title: getCopy(customer?.locale ?? 'fr').meta.card,
    ...(isCardToken(token) ? { manifest: `/c/${token}/manifest.webmanifest` } : {}),
  };
}

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const customer = await getCustomerByToken(getDb(), token);
  if (!customer) notFound();
  const view = buildCardView(customer);
  const copy = getCopy(customer.locale);
  const svg = await qrSvg(`${env().APP_URL}/c/${token}`);

  return (
    <main
      lang={LOCALE_LANG[customer.locale]}
      dir={LOCALE_DIR[customer.locale]}
      className="mx-auto max-w-md space-y-7 px-4 pt-4 pb-12"
    >
      <LocaleSwitcher current={customer.locale} token={token} />
      <h1 className="px-1 font-display text-3xl text-forest">{copy.card.hello(view.firstName)}</h1>
      <BirthdayBanner perk={view.birthdayPerk} copy={copy} />
      <LoyaltyCard cardStamps={view.cardStamps} qrSvg={svg} copy={copy} />
      <LevelPanel view={view} copy={copy} />
      {view.needsAddress && <AddressForm token={token} locale={customer.locale} />}
      <PerkList view={view} copy={copy} />
      <HowItWorks copy={copy} />
      <p className="px-1 text-center text-xs text-muted">{copy.card.homeScreen}</p>
      <RememberCard token={token} />
      <AutoRefresh token={token} />
    </main>
  );
}
