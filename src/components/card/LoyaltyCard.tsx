import { KinzLogo } from '@/components/brand/KinzLogo';
import { cardHint } from '@/lib/card-hint';
import { type Copy, splitReward } from '@/lib/copy';
import { CARD_MAX, CARD_STOPS } from '@/lib/rules';

const stopStamps = new Set<number>(CARD_STOPS.map((s) => s.stamps));

/** The customer's card: QR code to show at the till, the 13 stamps, and what comes next. */
export function LoyaltyCard({
  cardStamps,
  qrSvg,
  copy,
}: {
  cardStamps: number;
  qrSvg: string;
  copy: Copy;
}) {
  const hint = cardHint(cardStamps);
  const t = copy.card;
  const withReward = (template: string, reward: string, strong: boolean) => {
    const [before, after] = splitReward(template);
    return (
      <>
        {before}
        {strong ? <strong className="text-base text-white">{reward}</strong> : reward}
        {after}
      </>
    );
  };
  return (
    <section
      aria-label={t.label}
      className="rounded-[1.75rem] bg-forest px-5 pt-5 pb-6 text-lime shadow-[0_18px_40px_-24px_var(--color-forest)]"
    >
      <div className="flex items-center justify-between">
        <KinzLogo className="h-6 w-auto" />
        <p className="font-display text-lg">
          {`${cardStamps} / ${CARD_MAX}`}
          <span className="sr-only">{t.stampsSr}</span>
        </p>
      </div>

      <div dir="ltr" className="mx-auto mt-5 w-full max-w-60 rounded-2xl bg-white p-3">
        <div aria-label={t.qrLabel} dangerouslySetInnerHTML={{ __html: qrSvg }} />
      </div>
      <p className="mt-3 text-center text-sm text-lime/80">{t.present}</p>

      <ol className="mt-6 grid grid-cols-7 gap-2.5" aria-label={t.stampsLabel}>
        {Array.from({ length: CARD_MAX }, (_, i) => i + 1).map((n) => {
          const filled = n <= cardStamps;
          const stop = stopStamps.has(n);
          return (
            <li
              key={n}
              aria-label={t.stamp(n, filled, stop)}
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
          <p>{withReward(t.available, copy.stops[hint.available.stamps], true)}</p>
        )}
        {hint.full ? (
          <p className="text-lime/80">{t.full}</p>
        ) : (
          hint.next && (
            <p className={hint.available ? 'text-lime/80' : ''}>
              {hint.available
                ? withReward(
                    t.orContinue(hint.next.missing),
                    copy.stops[hint.next.stop.stamps],
                    false,
                  )
                : withReward(t.next(hint.next.missing), copy.stops[hint.next.stop.stamps], true)}
            </p>
          )
        )}
      </div>

      <details className="group mt-4 text-sm">
        <summary className="cursor-pointer list-none text-lime/80 underline decoration-lime/30 underline-offset-4 hover:text-lime">
          {t.allRewards}
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
                <span className={reached ? 'text-white' : 'text-lime/80'}>
                  {copy.stops[s.stamps]}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-lime/60">{t.finePrint}</p>
      </details>
    </section>
  );
}
