import { KinzLogo } from '@/components/brand/KinzLogo';
import { JoinForm } from '@/components/card/JoinForm';
import { RoadmapStrip } from '@/components/roadmap/RoadmapStrip';

export const metadata = { title: 'Rejoindre' };

const PROMISES = [
  'Un tampon à chaque visite, dès 40 TND d’achat',
  'Des récompenses aux niveaux 2, 3, 5, 7, 11, 13… à vous de deviner la suite',
];

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-8 pb-12">
      <KinzLogo variant="full" className="mx-auto h-28 w-auto text-forest" />
      <h1 className="mt-7 font-display text-3xl leading-tight text-forest">
        Votre carte de fidélité, dans votre téléphone
      </h1>
      <ul className="mt-4 space-y-2.5">
        {PROMISES.map((p) => (
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
          50 niveaux, et des pépins qui se multiplient en chemin :
        </h2>
        <RoadmapStrip className="mt-2 -mx-1" />
      </section>
      <div className="mt-7 rounded-3xl bg-white p-5">
        <JoinForm />
      </div>
    </main>
  );
}
