import Link from 'next/link';
import { KinzLogo } from '@/components/brand/KinzLogo';
import { getCopy, LOCALE_DIR, LOCALE_LANG } from '@/lib/copy';
import { visitorLocale } from '@/server/locale';

export default async function CardNotFound() {
  const locale = await visitorLocale();
  const t = getCopy(locale).notFound;
  return (
    <main
      lang={LOCALE_LANG[locale]}
      dir={LOCALE_DIR[locale]}
      className="mx-auto max-w-md px-4 pt-14 pb-12 text-center"
    >
      <KinzLogo className="mx-auto h-8 w-auto text-forest" />
      <h1 className="mt-10 font-display text-3xl text-forest">{t.heading}</h1>
      <p className="mt-3 text-muted">{t.text}</p>
      <Link
        href="/rejoindre?nouveau=1"
        className="mt-8 inline-block rounded-full bg-forest px-6 py-3 font-bold text-lime"
      >
        {t.create}
      </Link>
    </main>
  );
}
