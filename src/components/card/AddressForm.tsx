'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export function AddressForm({ token }: { token: string }) {
  const router = useRouter();
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
        setError((await res.json()).error ?? 'Erreur');
        return;
      }
      router.refresh();
    } catch {
      setError('Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border-2 border-olive bg-white p-5">
      <h2 className="font-display text-2xl text-forest">Vous êtes Figuier</h2>
      <p className="text-sm">Où devons-nous livrer vos nouveautés en avant-première ?</p>
      <label htmlFor="address" className="block text-sm font-bold">
        Adresse de livraison
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
        {busy ? 'Enregistrement…' : 'Enregistrer l’adresse'}
      </button>
    </form>
  );
}
