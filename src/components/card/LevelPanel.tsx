import { isGolden } from '@/lib/rules';
import type { CardView } from '@/lib/views';

const pepinsWord = (n: number) => (n === 1 ? 'pépin' : 'pépins');

export function LevelPanel({ view }: { view: CardView }) {
  const { level, title, multiplier, lifetimePepins, progress } = view;
  const pct = progress.levelCost
    ? Math.round((progress.intoLevel / progress.levelCost) * 100)
    : 100;
  const missing = progress.levelCost ? progress.levelCost - progress.intoLevel : 0;
  return (
    <section aria-labelledby="level-title" className="px-1">
      <p className="text-sm font-bold text-olive-ink">
        Niveau {level}
        {isGolden(level) && <span className="font-normal"> ✦ niveau d’or</span>}
      </p>
      <div className="flex items-end justify-between gap-3">
        <h2 id="level-title" className="font-display text-4xl leading-tight text-forest">
          {title}
        </h2>
        {multiplier > 1 && (
          <p className="mb-1.5 shrink-0 rounded-full bg-forest px-3 py-1 text-sm font-bold text-lime">
            Pépins ×{multiplier}
          </p>
        )}
      </div>

      {progress.levelCost ? (
        <>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-forest/10"
            role="progressbar"
            aria-label="Progression vers le niveau suivant"
            aria-valuemin={0}
            aria-valuemax={progress.levelCost}
            aria-valuenow={progress.intoLevel}
          >
            <div className="h-full rounded-full bg-olive" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {lifetimePepins} {pepinsWord(lifetimePepins)} au total. Encore {missing}{' '}
            {pepinsWord(missing)} avant le niveau {level + 1}.
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {lifetimePepins} pépins au total. Niveau maximal atteint : vous êtes une Légende.
        </p>
      )}
    </section>
  );
}
