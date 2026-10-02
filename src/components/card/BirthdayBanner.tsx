import type { CardView } from '@/lib/views';

const TEXT = {
  month: 'Joyeux mois d’anniversaire ! −20 % sur vos achats chez KINZ jusqu’à la fin du mois.',
  day: 'Joyeux anniversaire ! Aujourd’hui, vos tampons sont doublés, et −20 % sur vos achats.',
} as const;

export function BirthdayBanner({ perk }: { perk: CardView['birthdayPerk'] }) {
  if (!perk) return null;
  return (
    <p className="flex items-start gap-3 rounded-3xl bg-lime px-5 py-4 text-forest">
      <span
        aria-hidden
        className="mt-1.5 size-3 shrink-0 rounded-tl-full rounded-br-full bg-forest"
      />
      {TEXT[perk]}
    </p>
  );
}
