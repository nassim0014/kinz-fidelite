import type { Copy } from '@/lib/copy';
import type { CardView } from '@/lib/views';

export function BirthdayBanner({ perk, copy }: { perk: CardView['birthdayPerk']; copy: Copy }) {
  if (!perk) return null;
  return (
    <p className="flex items-start gap-3 rounded-3xl bg-lime px-5 py-4 text-forest">
      <span
        aria-hidden
        className="mt-1.5 size-3 shrink-0 rounded-tl-full rounded-br-full bg-forest"
      />
      {copy.birthday[perk]}
    </p>
  );
}
