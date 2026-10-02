import type { Metadata } from 'next';
import { KinzLogo } from '@/components/brand/KinzLogo';
import { JoinForm } from '@/components/card/JoinForm';
import { RoadmapStrip } from '@/components/roadmap/RoadmapStrip';
import { getCopy } from '@/lib/copy';
import { visitorLocale } from '@/server/locale';

export async function generateMetadata(): Promise<Metadata> {
  return { title: getCopy(await visitorLocale()).meta.join };
}

export default async function JoinPage() {
  const locale = await visitorLocale();
  const copy = getCopy(locale);
  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-12">
      <KinzLogo variant="full" className="mx-auto h-28 w-auto text-forest" />
      <h1 className="mt-7 font-display text-3xl leading-tight text-forest">{copy.join.heading}</h1>
      <ul className="mt-4 space-y-2.5">
        {copy.join.promises.map((p) => (
          <li key={p} className="flex items-start gap-3 text-[0.95rem]">
            <span
              aria-hidden
              className="mt-1.5 size-3 shrink-0 rounded-tl-full rounded-br-full bg-olive"
            />
            {p}
          </li>
        ))}
      </ul>
      <section aria-labelledby="parcours" className="mt-6">
        <h2 id="parcours" className="text-[0.95rem]">
          {copy.join.journey}
        </h2>
        <RoadmapStrip copy={copy} className="mt-2 -mx-1" />
      </section>
      <div className="mt-7 rounded-3xl bg-white p-5">
        <JoinForm locale={locale} />
      </div>
    </main>
  );
}
