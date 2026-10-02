import type { Copy } from '@/lib/copy';
import type { CardView } from '@/lib/views';

export function PerkList({ view, copy }: { view: CardView; copy: Copy }) {
  const t = copy.perksList;
  return (
    <section aria-labelledby="perks-title" className="rounded-3xl bg-white p-5">
      <h2 id="perks-title" className="font-display text-2xl text-forest">
        {t.heading}
      </h2>
      {view.perks.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{t.none}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {view.perks.map((p) => (
            <li key={p.level} className="flex gap-3 text-sm">
              <span
                className="w-12 shrink-0 pt-px text-xs font-bold text-olive-ink tabular-nums"
                aria-label={t.levelLong(p.level)}
              >
                {t.levelShort(p.level)}
              </span>
              <span>{copy.perks[p.level]}</span>
            </li>
          ))}
        </ul>
      )}
      {view.nextPerk && (
        <p className="mt-4 rounded-2xl bg-paper p-3 text-sm">
          <span className="font-bold text-forest">{t.nextAt(view.nextPerk.level)}</span>
          {copy.perks[view.nextPerk.level]}
        </p>
      )}
    </section>
  );
}
