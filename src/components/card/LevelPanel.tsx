import { isGolden } from '@/lib/rules';
import type { CardView } from '@/lib/views';

export function LevelPanel({ view }: { view: CardView }) {
  const { level, title, multiplier, lifetimePepins, progress } = view;
  const pct = progress.levelCost
    ? Math.round((progress.intoLevel / progress.levelCost) * 100)
    : 100;
  return (
    <section className="rounded-2xl bg-olive-900 p-4 text-white">
      <p className="text-sm text-gold-pale">
        Niveau {level}
        {isGolden(level) ? ' ✦ niveau d’or (premier et Fibonacci)' : ''}
      </p>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-1 text-sm">
        {lifetimePepins} pépins · multiplicateur ×{multiplier}
      </p>
      {progress.levelCost ? (
        <>
          <div
            className="mt-3 h-2 rounded-full bg-white/20"
            role="progressbar"
            aria-label="Progression vers le niveau suivant"
            aria-valuemin={0}
            aria-valuemax={progress.levelCost}
            aria-valuenow={progress.intoLevel}
          >
            <div className="h-2 rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gold-pale">
            Encore {progress.levelCost - progress.intoLevel} pépins avant le niveau {level + 1}
          </p>
        </>
      ) : (
        <p className="mt-2 text-gold-pale">Niveau maximal atteint. Vous êtes une Légende.</p>
      )}
    </section>
  );
}
