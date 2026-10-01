'use client';

import { type FormEvent, useState } from 'react';
import { StampTrack } from '@/components/card/StampTrack';
import { parseAmount } from '@/lib/amount';
import type { StaffCustomerView } from '@/lib/views';

interface Props {
  view: StaffCustomerView;
  busy: boolean;
  onStamp: (amount: string) => Promise<boolean>;
  onRedeem: (stop: number) => Promise<void>;
  onPerk: (level: number) => Promise<void>;
  onNext: () => void;
}

export function CustomerPanel({ view, busy, onStamp, onRedeem, onPerk, onNext }: Props) {
  const [amount, setAmount] = useState('');
  const [confirmBig, setConfirmBig] = useState(false);
  const [pendingStop, setPendingStop] = useState<number | null>(null);
  const parsed = parseAmount(amount);
  const { card } = view;
  const reached = card.stops.filter((s) => s.reached);

  async function submitStamp(e: FormEvent) {
    e.preventDefault();
    if (parsed === null) return;
    if (parsed >= 300 && !confirmBig) {
      setConfirmBig(true);
      return;
    }
    setConfirmBig(false);
    if (await onStamp(amount)) setAmount('');
  }

  const btn = 'rounded-full px-5 py-3 font-bold disabled:opacity-50';
  return (
    <div className="space-y-4">
      <header className="rounded-2xl bg-olive-900 p-4 text-white">
        <h2 className="font-display text-2xl">{card.firstName}</h2>
        <p className="text-sm text-gold-pale">
          {view.phone} · Niveau {card.level} — {card.title} · ×{card.multiplier}
        </p>
      </header>

      <StampTrack cardStamps={card.cardStamps} />

      {view.stampedToday ? (
        <p className="rounded-xl bg-white p-4 font-bold">Déjà tamponné aujourd&apos;hui</p>
      ) : (
        <form onSubmit={submitStamp} className="space-y-2 rounded-2xl bg-white p-4">
          <label htmlFor="amount" className="block text-sm font-bold">
            Montant du ticket (TND)
          </label>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="85,500"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setConfirmBig(false);
            }}
            className="w-full rounded-lg border border-olive-700/40 p-3 text-lg"
          />
          {amount && parsed === null && (
            <p role="alert" className="text-sm text-red-800">
              Montant invalide
            </p>
          )}
          <button
            disabled={busy || parsed === null}
            className={`${btn} w-full bg-olive-900 text-white`}
          >
            {confirmBig ? `Confirmer ${parsed} TND` : 'Tamponner'}
          </button>
          {confirmBig && (
            <p className="text-sm">Montant élevé : vérifiez le ticket puis confirmez.</p>
          )}
        </form>
      )}

      <section className="space-y-2 rounded-2xl bg-white p-4">
        <h3 className="font-display text-lg">Récompenses</h3>
        {reached.length === 0 && (
          <p className="text-sm text-muted">Aucune récompense disponible.</p>
        )}
        {reached.map((s) =>
          pendingStop === s.stamps ? (
            <div key={s.stamps} className="space-y-2 rounded-xl border-2 border-gold p-3">
              <p className="text-sm">
                Appliquez « {s.label} » en caisse, puis confirmez. La carte sera remise à zéro.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => onRedeem(s.stamps).then(() => setPendingStop(null))}
                  className={`${btn} bg-olive-900 text-white`}
                >
                  Confirmer
                </button>
                <button onClick={() => setPendingStop(null)} className={`${btn} bg-sand`}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              key={s.stamps}
              disabled={busy}
              onClick={() => setPendingStop(s.stamps)}
              className={`${btn} block w-full border-2 border-olive-900 text-left`}
            >
              Utiliser — palier {s.stamps} <span className="font-normal">({s.label})</span>
            </button>
          ),
        )}
      </section>

      {view.givablePerks.length > 0 && (
        <section className="space-y-2 rounded-2xl bg-white p-4">
          <h3 className="font-display text-lg">Avantages à remettre</h3>
          {view.givablePerks.map((p) => (
            <div key={p.level} className="flex items-center justify-between gap-2 text-sm">
              <span>
                N{p.level} — {p.label}
              </span>
              <button
                disabled={busy}
                onClick={() => onPerk(p.level)}
                className="rounded-full border border-olive-900 px-3 py-1"
              >
                Marquer comme remis
              </button>
            </div>
          ))}
        </section>
      )}

      <button onClick={onNext} className={`${btn} w-full bg-sand`}>
        Client suivant
      </button>
    </div>
  );
}
