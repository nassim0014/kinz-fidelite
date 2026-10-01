import { KinzLogo } from '@/components/brand/KinzLogo';
import { buildRoadmap, type Milestone } from '@/lib/roadmap';
import { CARD_MAX } from '@/lib/rules';

/**
 * The full journey on one A3 sheet, framed in the shop: the 13-stamp card on top, then the branch
 * growing from Graine (bottom) to the Légende (top). Sizes are in print units (mm, pt).
 */
export function RoadmapPoster({ qrSvg }: { qrSvg: string }) {
  const { milestones, cardStops } = buildRoadmap();
  const stopAt = new Map(cardStops.map((s) => [s.stamps as number, s]));
  const top = milestones.at(-1)!.level;

  return (
    <article className="sheet-a3 mx-auto flex flex-col bg-white px-[24mm] pt-[22mm] pb-[20mm] text-ink">
      <header className="text-center text-forest">
        <KinzLogo variant="full" className="mx-auto h-[34mm] w-auto" />
        <h1 className="mt-[7mm] font-display text-[30pt] leading-none">
          De la graine au figuier d’or
        </h1>
      </header>

      <section aria-labelledby="carte" className="mt-[9mm]">
        <div className="flex items-baseline justify-between border-b border-forest/20 pb-[2mm]">
          <h2 id="carte" className="font-display text-[18pt] text-forest">
            La carte
          </h2>
          <p className="text-[10.5pt] text-muted">
            1 tampon dès 40 TND d’achat, 2 dès 120 TND, 3 dès 300 TND
          </p>
        </div>
        <ol className="mt-[4mm] flex justify-between">
          {Array.from({ length: CARD_MAX }, (_, i) => i + 1).map((n) => (
            <li
              key={n}
              className={[
                'flex size-[14mm] items-center justify-center text-[11pt] font-bold',
                stopAt.has(n)
                  ? 'rounded-tl-full rounded-br-full bg-forest text-lime'
                  : 'rounded-full border-[0.4mm] border-forest/30 text-forest/60',
              ].join(' ')}
            >
              {n}
            </li>
          ))}
        </ol>
        <ul className="mt-[4mm] grid grid-cols-5 gap-[4mm]">
          {cardStops.map((s) => (
            <li key={s.stamps} className="text-[9.5pt] leading-snug">
              <span className="font-display text-[13pt] text-forest">{s.stamps}</span>
              <span className="block">{s.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-[3mm] text-[8.5pt] text-muted">
          Utiliser une récompense remet la carte à zéro. Produits à l’unité (hors packs, trios,
          duos, collections et coffrets), produit offert d’une valeur maximale de 49 TND.
        </p>
      </section>

      <section aria-label="Les niveaux" className="mt-[8mm] flex flex-1 flex-col">
        <KinzLogo variant="laurel" title={null} className="mx-auto h-[9mm] w-auto text-olive" />
        <ol className="mt-[1mm] flex flex-1 flex-col-reverse">
          {milestones.map((m) => (
            <BranchRow key={m.level} m={m} first={m.level === 1} last={m.level === top} />
          ))}
        </ol>
      </section>

      <footer className="mt-[6mm] flex items-center gap-[8mm] border-t border-forest/20 pt-[5mm]">
        <p className="flex-1 text-[10.5pt] leading-snug">
          <span className="font-display text-[14pt] text-forest">Les pépins. </span>
          Chaque tranche de 40 TND vous rapporte 1 pépin. Ils ne s’effacent jamais et font monter
          votre niveau : passer au suivant coûte autant de pépins que votre niveau actuel.
        </p>
        <div className="flex shrink-0 items-center gap-[3mm]">
          <p className="text-right text-[10pt] leading-snug text-forest">
            Pas encore
            <br />
            de carte ?
            <br />
            <strong>Scannez.</strong>
          </p>
          <div className="w-[26mm]" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>
      </footer>
    </article>
  );
}

function BranchRow({ m, first, last }: { m: Milestone; first: boolean; last: boolean }) {
  const boost = m.stage?.boost ?? null;
  return (
    <li className="grid flex-1 grid-cols-[1fr_16mm_1.3fr] items-center">
      <div className="pr-[4mm] text-right text-forest">
        {m.stage && (
          <p className="font-display text-[19pt] leading-none">
            {m.stage.title}
            {boost && (
              <span className="ml-[2.5mm] inline-block translate-y-[-0.6mm] rounded-full bg-forest px-[2.2mm] py-[0.6mm] align-middle font-sans text-[9pt] font-bold text-lime">
                pépins ×{boost}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="relative flex h-full items-center justify-center">
        <span
          aria-hidden
          className={[
            'absolute left-1/2 w-[0.7mm] -translate-x-1/2 bg-olive',
            first ? 'top-0 bottom-1/2' : last ? 'top-1/2 bottom-0' : 'inset-y-0',
          ].join(' ')}
        />
        <span
          className={[
            'relative flex size-[8.5mm] items-center justify-center text-[9.5pt] font-bold tabular-nums',
            boost
              ? 'rounded-full bg-forest text-lime'
              : m.perk
                ? 'rounded-tl-full rounded-br-full border-[0.4mm] border-forest bg-lime text-forest'
                : 'rounded-full border-[0.4mm] border-forest bg-white text-forest',
          ].join(' ')}
        >
          {m.level}
        </span>
      </div>

      <p className="pl-[4mm] text-[10.5pt] leading-tight">
        {m.perk ? m.perk.label : first ? <em className="text-muted">Commencez ici</em> : null}
      </p>
    </li>
  );
}
