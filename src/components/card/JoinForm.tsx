'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { readStoredToken, storeToken } from '@/lib/card-storage';

export function JoinForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = readStoredToken();
    if (stored && !window.location.search.includes('nouveau')) router.replace(`/c/${stored}`);
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ firstName, phone, birthday: birthday || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Erreur');
        return;
      }
      storeToken(data.token);
      router.push(`/c/${data.token}`);
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.');
    } finally {
      setBusy(false);
    }
  }

  const input =
    'mt-1 w-full rounded-xl border border-forest/25 bg-white p-3 text-base focus:border-forest';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-bold text-forest">
          Prénom
        </label>
        <input
          id="firstName"
          required
          maxLength={40}
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-bold text-forest">
          Téléphone
        </label>
        <input
          id="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="22 123 456"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="birthday" className="block text-sm font-bold text-forest">
          Date d’anniversaire <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <input
          id="birthday"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className={input}
        />
        <p className="mt-1 text-xs text-muted">
          Elle débloque des cadeaux le mois de votre anniversaire. Vos données restent chez KINZ.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-full bg-forest py-3.5 font-bold text-lime disabled:opacity-50"
      >
        {busy ? 'Création de la carte…' : 'Créer ma carte'}
      </button>
    </form>
  );
}
