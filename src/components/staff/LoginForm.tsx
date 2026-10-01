'use client';

import { type FormEvent, useState } from 'react';

export function LoginForm() {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, pin }),
      });
      if (!res.ok) {
        setError((await res.json()).error ?? 'Erreur');
        setPin('');
        return;
      }
      // Full navigation on purpose: re-renders the server page with the new cookie state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/staff';
    } catch {
      setError('Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-olive-700/40 bg-white p-3';
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-bold">
          Nom
        </label>
        <input
          id="name"
          required
          autoComplete="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="pin" className="block text-sm font-bold">
          PIN
        </label>
        <input
          id="pin"
          required
          type="password"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="current-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={input}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="w-full rounded-full bg-olive-900 py-3 font-bold text-white disabled:opacity-50"
      >
        Se connecter
      </button>
    </form>
  );
}
