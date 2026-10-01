import type { RedeemResult, StampResult } from './views';

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

export function stampMessage(r: StampResult): string {
  const parts = [`+${plural(r.stampsAdded, 'tampon')}`, `+${plural(r.pepinsAdded, 'pépin')}`];
  if (r.levelAfter > r.levelBefore) parts.push(`Niveau ${r.levelAfter} atteint !`);
  if (r.cardFull) parts.push('Carte pleine — utilisez la récompense');
  return parts.join(' · ');
}

export function redeemMessage(r: RedeemResult): string {
  return `Récompense appliquée : ${r.label}. Carte remise à ${r.cardStamps}.`;
}
