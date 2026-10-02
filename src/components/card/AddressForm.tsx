'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { errorText, getCopy, type Locale } from '@/lib/copy';

export function AddressForm({ token, locale }: { token: string; locale: Locale }) {
  const router = useRouter();
  const copy = getCopy(locale);
  const t = copy.address;
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${token}/address`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) {
        setError(errorText(copy, (await res.json()).code));
        return;
      }
      router.refresh();
    } catch {
      setError(copy.errors.NETWORK);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border-2 border-olive bg-white p-5">
      <h2 className="font-display text-2xl text-forest">{t.heading}</h2>
      <p className="text-sm">{t.intro}</p>
      <label htmlFor="address" className="block text-sm font-bold">
        {t.label}
      </label>
      <textarea
        id="address"
        required
        minLength={5}
        maxLength={300}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded-xl border border-forest/25 p-3 focus:border-forest"
      />
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-full bg-forest px-6 py-3 font-bold text-lime disabled:opacity-50"
      >
        {busy ? t.saving : t.save}
      </button>
    </form>
  );
}
