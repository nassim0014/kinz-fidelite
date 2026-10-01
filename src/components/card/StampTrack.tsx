import { CARD_MAX, CARD_STOPS, type CardStop } from '@/lib/rules';

const stopAt = new Map<number, CardStop>(CARD_STOPS.map((s) => [s.stamps, s]));

export function StampTrack({ cardStamps }: { cardStamps: number }) {
  return (
    <section aria-label="Carte à tampons" className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl">Ma carte</h2>
        <p className="font-bold">
          {cardStamps} / {CARD_MAX}
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-2">
        {Array.from({ length: CARD_MAX }, (_, i) => i + 1).map((n) => {
          const filled = n <= cardStamps;
          const stop = stopAt.get(n);
          return (
            <li
              key={n}
              title={stop?.label}
              className={[
                'flex aspect-square items-center justify-center rounded-full border-2 text-sm font-bold',
                filled ? 'border-forest bg-forest text-white' : 'border-olive/40 text-muted',
                stop ? 'ring-2 ring-olive ring-offset-2' : '',
              ].join(' ')}
            >
              {n}
            </li>
          );
        })}
      </ol>
      <ul className="mt-4 space-y-1 text-sm">
        {CARD_STOPS.map((s) => {
          const reached = s.stamps <= cardStamps;
          return (
            <li key={s.stamps} className={reached ? 'font-bold text-forest' : 'text-muted'}>
              <span className="inline-block w-8 font-display">{s.stamps}</span>
              {s.label}
              {reached ? ' (disponible)' : ''}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Produits à l’unité uniquement (hors packs, trios, duos, collections et coffrets). Produit
        offert d’une valeur maximale de 49 TND.
      </p>
    </section>
  );
}
