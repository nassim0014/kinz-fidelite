import { buildRoadmap } from '@/lib/roadmap';

const short = (title: string) => title.split(' du ')[0];

/**
 * The seven titles on one branch, alternating above and below it like the leaves of the logo's
 * laurel, so each name gets two columns of room on a phone.
 */
export function RoadmapStrip({ className = '' }: { className?: string }) {
  const { stages } = buildRoadmap();
  return (
    <figure className={className}>
      <ol
        aria-label="Les étapes du parcours"
        className="grid grid-cols-7 grid-rows-[auto_1.5rem_auto] text-forest"
      >
        {stages.map((s, i) => {
          const above = i % 2 === 1;
          return (
            <li key={s.from} className="contents">
              <div
                className={[
                  'col-span-1 flex flex-col items-center text-center whitespace-nowrap',
                  above ? 'row-start-1 justify-end pb-1' : 'row-start-3 pt-1',
                ].join(' ')}
                style={{ gridColumnStart: i + 1 }}
              >
                <span className="text-[0.65rem] text-muted tabular-nums">{s.from}</span>
                <span className="font-display text-[0.9rem] leading-tight">{short(s.title)}</span>
                {/* Every stage keeps room for a badge so names line up across the row. */}
                <span
                  aria-hidden={!s.boost}
                  className={[
                    'mt-0.5 rounded-full bg-forest px-1.5 text-[0.6rem] font-bold text-lime',
                    s.boost ? '' : 'invisible',
                  ].join(' ')}
                >
                  ×{s.boost ?? 1}
                </span>
              </div>
              <div
                className="relative row-start-2 flex items-center justify-center"
                style={{ gridColumnStart: i + 1 }}
              >
                <span
                  aria-hidden
                  className={[
                    'absolute top-1/2 h-0.5 -translate-y-1/2 bg-olive',
                    i === 0
                      ? 'left-1/2 right-0'
                      : i === stages.length - 1
                        ? 'right-1/2 left-0'
                        : 'inset-x-0',
                  ].join(' ')}
                />
                <span
                  aria-hidden
                  className={[
                    'relative rounded-tl-full rounded-br-full',
                    above ? '' : 'rotate-90',
                    i === stages.length - 1 ? 'size-4 bg-forest' : 'size-3.5 bg-olive',
                  ].join(' ')}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <figcaption className="sr-only">
        De la graine au figuier d’or :{' '}
        {stages.map((s) => `${s.title} au niveau ${s.from}`).join(', ')}.
      </figcaption>
    </figure>
  );
}
