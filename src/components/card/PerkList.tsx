import type { CardView } from '@/lib/views';

export function PerkList({ view }: { view: CardView }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-display text-xl">Mes avantages</h2>
      {view.perks.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Votre premier avantage arrive au niveau 2.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {view.perks.map((p) => (
            <li key={p.level}>
              <span className="inline-block w-10 font-bold text-bronze">N{p.level}</span>
              {p.label}
            </li>
          ))}
        </ul>
      )}
      {view.nextPerk && (
        <p className="mt-3 border-t border-sand pt-3 text-sm">
          Prochain : <strong>niveau {view.nextPerk.level}</strong> — {view.nextPerk.label}
        </p>
      )}
    </section>
  );
}
