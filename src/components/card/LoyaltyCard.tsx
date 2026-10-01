import { KinzLogo } from '@/components/brand/KinzLogo';
import { cardHint, stampsWord } from '@/lib/card-hint';
import { CARD_MAX, CARD_STOPS } from '@/lib/rules';

const stopStamps = new Set<number>(CARD_STOPS.map((s) => s.stamps));

/** The customer's card: QR code to show at the till, the 13 stamps, and what comes next. */
export function LoyaltyCard({ cardStamps, qrSvg }: { cardStamps: number; qrSvg: string }) {
  const hint = cardHint(cardStamps);
  return (
    <section
      aria-label="Ma carte KINZ"
      className="rounded-[1.75rem] bg-forest px-5 pt-5 pb-6 text-lime shadow-[0_18px_40px_-24px_var(--color-forest)]"
    >
      <div className="flex items-center justify-between">
        <KinzLogo className="h-6 w-auto" />
        <p className="font-display text-lg">
          {`${cardStamps} / ${CARD_MAX}`}
          <span className="sr-only"> tampons</span>
        </p>
      </div>

      <div className="mx-auto mt-5 w-full max-w-60 rounded-2xl bg-white p-3">
        <div aria-label="QR code de votre carte" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
      <p className="mt-3 text-center text-sm text-lime/80">
        Présentez ce code au comptoir après un achat d’au moins 40 TND.
      </p>

      <ol className="mt-6 grid grid-cols-7 gap-2.5" aria-label="Tampons">
        {Array.from({ length: CARD_MAX }, (_, i) => i + 1).map((n) => {
          const filled = n <= cardStamps;
          const stop = stopStamps.has(n);
          return (
            <li
              key={n}
              aria-label={`Tampon ${n}${filled ? ', obtenu' : ''}${stop ? ', récompense' : ''}`}
              style={filled ? { animationDelay: `${n * 45}ms` } : undefined}
              className={[
                'flex aspect-square items-center justify-center text-xs font-bold tabular-nums',
                // Reward stamps take the shape of the leaf in the K of the logo.
                stop ? 'rounded-tl-full rounded-br-full' : 'rounded-full',
                filled
                  ? 'stamp-in bg-lime text-forest'
                  : stop
                    ? 'border-2 border-olive text-olive'
                    : 'border border-lime/30 text-lime/50',
              ].join(' ')}
            >
              {n}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 space-y-1 border-t border-lime/20 pt-4 text-sm" aria-live="polite">
        {hint.available && (
          <p>
            <strong className="text-base text-white">{hint.available.label}</strong> à utiliser au
            comptoir.
          </p>
        )}
        {hint.full ? (
          <p className="text-lime/80">
            Carte pleine. Utilisez votre récompense lors de votre visite.
          </p>
        ) : (
          hint.next && (
            <p className={hint.available ? 'text-lime/80' : ''}>
              {hint.available ? 'Ou continuez : encore ' : 'Encore '}
              {hint.next.missing} {stampsWord(hint.next.missing)} pour{' '}
              {hint.available ? hint.next.stop.label : <strong>{hint.next.stop.label}</strong>}.
            </p>
          )
        )}
      </div>

      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer list-none text-lime/80 underline decoration-lime/30 underline-offset-4 hover:text-lime">
          Toutes les récompenses de la carte
        </summary>
        <ul className="mt-3 space-y-2">
          {CARD_STOPS.map((s) => {
            const reached = s.stamps <= cardStamps;
            return (
              <li key={s.stamps} className="flex gap-3">
                <span
                  className={[
                    'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-tl-full rounded-br-full text-[0.7rem] font-bold',
                    reached ? 'bg-lime text-forest' : 'border border-olive text-olive',
                  ].join(' ')}
                >
                  {s.stamps}
                </span>
                <span className={reached ? 'text-white' : 'text-lime/80'}>{s.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-lime/60">
          Utiliser une récompense remet la carte à zéro. Produits à l’unité uniquement (hors packs,
          trios, duos, collections et coffrets). Produit offert d’une valeur maximale de 49 TND.
        </p>
      </details>
    </section>
  );
}
