'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { type FormEvent, useCallback, useState } from 'react';
import { redeemMessage, stampMessage } from '@/lib/messages';
import type { RedeemResult, StaffCustomerView, StampResult } from '@/lib/views';
import { CustomerPanel } from './CustomerPanel';

const QrScanner = dynamic(() => import('./QrScanner').then((m) => m.QrScanner), { ssr: false });

type Msg = { kind: 'ok' | 'warn' | 'error'; text: string } | null;

export function StaffConsole({
  staffName,
  isOwner,
  appUrl,
}: {
  staffName: string;
  isOwner: boolean;
  appUrl: string;
}) {
  const [view, setView] = useState<StaffCustomerView | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState('');

  const call = useCallback(async <T,>(url: string, body?: unknown): Promise<T | null> => {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json();
      if (res.status === 401) {
        // Full navigation on purpose: re-renders the server page with the new cookie state.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/staff/login';
        return null;
      }
      if (!res.ok) {
        setMsg({ kind: 'error', text: data.error ?? 'Erreur' });
        return null;
      }
      return data as T;
    } catch {
      setMsg({ kind: 'error', text: 'Connexion impossible — vérifiez le réseau' });
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const load = useCallback(
    async (query: string) => {
      const v = await call<StaffCustomerView>(`/api/staff/customer?${query}`);
      if (v) setView(v);
      return v !== null;
    },
    [call],
  );

  const onToken = useCallback(
    (token: string) => {
      setMsg(null);
      return load(`token=${encodeURIComponent(token)}`);
    },
    [load],
  );

  function search(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    void load(`phone=${encodeURIComponent(phone)}`);
  }

  async function onStamp(amount: string): Promise<boolean> {
    if (!view) return false;
    setMsg(null);
    const r = await call<StampResult>('/api/staff/stamp', { customerId: view.customerId, amount });
    if (!r) return false;
    setMsg({ kind: r.cardFull ? 'warn' : 'ok', text: stampMessage(r) });
    await load(`token=${view.card.token}`);
    return true;
  }

  async function onRedeem(stop: number) {
    if (!view) return;
    setMsg(null);
    const r = await call<RedeemResult>('/api/staff/redeem', { customerId: view.customerId, stop });
    if (!r) return;
    setMsg({ kind: 'ok', text: redeemMessage(r) });
    await load(`token=${view.card.token}`);
  }

  async function onPerk(perkLevel: number) {
    if (!view) return;
    setMsg(null);
    if (await call('/api/staff/perk', { customerId: view.customerId, perkLevel })) {
      setMsg({ kind: 'ok', text: 'Avantage marqué comme remis' });
      await load(`token=${view.card.token}`);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Full navigation on purpose: re-renders the server page with the new cookie state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/staff/login';
  }

  const tone = {
    ok: 'bg-olive-700 text-white',
    warn: 'bg-gold-pale text-ink',
    error: 'bg-red-100 text-red-900',
  };
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-4">
      <header className="flex items-center justify-between text-sm">
        <span>
          Équipe : <strong>{staffName}</strong>
        </span>
        <span className="flex gap-3">
          {isOwner && (
            <Link href="/admin" className="underline">
              Admin
            </Link>
          )}
          <button onClick={logout} className="underline">
            Déconnexion
          </button>
        </span>
      </header>

      {msg && (
        <p role="status" className={`rounded-xl p-3 font-bold ${tone[msg.kind]}`}>
          {msg.text}
        </p>
      )}

      {view ? (
        <CustomerPanel
          appUrl={appUrl}
          view={view}
          busy={busy}
          onStamp={onStamp}
          onRedeem={onRedeem}
          onPerk={onPerk}
          onNext={() => {
            setView(null);
            setMsg(null);
            setPhone('');
          }}
        />
      ) : (
        <>
          <QrScanner onToken={onToken} />
          <form onSubmit={search} className="space-y-2 rounded-2xl bg-white p-4">
            <label htmlFor="phone" className="block text-sm font-bold">
              Téléphone du client
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-olive-700/40 p-3"
            />
            <button
              disabled={busy || !phone}
              className="w-full rounded-full bg-olive-900 py-3 font-bold text-white disabled:opacity-50"
            >
              Rechercher
            </button>
          </form>
        </>
      )}
    </main>
  );
}
