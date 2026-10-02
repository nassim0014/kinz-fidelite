'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getCopy, type Locale, LOCALE_LABEL, LOCALE_LANG, LOCALES } from '@/lib/copy';

/** FR · Tounsi · EN · عربي. With a card token the choice is saved on the card, otherwise on the phone. */
export function LocaleSwitcher({ current, token }: { current: Locale; token?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function choose(locale: Locale) {
    if (locale === current || busy) return;
    setBusy(true);
    try {
      await fetch(token ? `/api/customers/${token}/locale` : '/api/locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <nav aria-label={getCopy(current).switcher} className="flex justify-end gap-1 text-sm">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={LOCALE_LANG[l]}
          aria-pressed={l === current}
          disabled={busy}
          onClick={() => void choose(l)}
          className={[
            'rounded-full px-3 py-1',
            l === current ? 'bg-forest font-bold text-lime' : 'text-forest hover:bg-forest/10',
          ].join(' ')}
        >
          {LOCALE_LABEL[l]}
        </button>
      ))}
    </nav>
  );
}
