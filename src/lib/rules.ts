/** Le Code KINZ: every game rule lives here. Pure functions only. */

export const MIN_AMOUNT_TND = 40;
export const MAX_AMOUNT_TND = 5000;
export const CARD_MAX = 13;
export const MAX_LEVEL = 50;

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

export function isFibonacci(n: number): boolean {
  if (!Number.isInteger(n) || n < 1) return false;
  let [a, b] = [1, 2];
  while (a < n) [a, b] = [b, a + b];
  return a === n;
}

export const isGolden = (n: number): boolean => isPrime(n) && isFibonacci(n);

export function stampsFor(amountTnd: number): 0 | 1 | 2 | 3 {
  if (amountTnd >= 300) return 3;
  if (amountTnd >= 120) return 2;
  if (amountTnd >= MIN_AMOUNT_TND) return 1;
  return 0;
}

export function stampsForVisit(amountTnd: number, level: number, isBirthday: boolean): number {
  const base = stampsFor(amountTnd);
  return level >= 19 && isBirthday ? base * 2 : base;
}

export function multiplier(level: number): 1 | 2 | 3 | 5 {
  if (level >= 34) return 5;
  if (level >= 21) return 3;
  if (level >= 13) return 2;
  return 1;
}

export function pepinsFor(amountTnd: number, level: number): number {
  return Math.floor(amountTnd / MIN_AMOUNT_TND) * multiplier(level);
}

/** Going from level n to n+1 costs n pépins, so level L needs L(L−1)/2 in total. */
export function pepinsToReach(level: number): number {
  return (level * (level - 1)) / 2;
}

export function levelFromPepins(pepins: number): number {
  let level = 1;
  while (level < MAX_LEVEL && pepinsToReach(level + 1) <= pepins) level++;
  return level;
}

export function levelProgress(pepins: number): {
  level: number;
  intoLevel: number;
  levelCost: number | null;
} {
  const level = levelFromPepins(pepins);
  return {
    level,
    intoLevel: pepins - pepinsToReach(level),
    levelCost: level < MAX_LEVEL ? level : null,
  };
}

export function title(level: number): string {
  if (level >= 50) return 'Légende du Figuier d’Or';
  if (level >= 34) return 'Figuier';
  if (level >= 21) return 'Figue';
  if (level >= 13) return 'Fleur';
  if (level >= 8) return 'Raquette';
  if (level >= 5) return 'Pousse';
  return 'Graine';
}

export type StopStamps = 3 | 5 | 7 | 11 | 13;

export interface CardStop {
  stamps: StopStamps;
  label: string;
  bonusPepins: number;
}

export const CARD_STOPS: readonly CardStop[] = [
  { stamps: 3, label: '−20 % sur 1 produit', bonusPepins: 0 },
  { stamps: 5, label: '−50 % sur 1 produit', bonusPepins: 0 },
  { stamps: 7, label: '−50 % sur 2 produits', bonusPepins: 0 },
  { stamps: 11, label: '1 produit offert (≤ 49 TND) + 11 pépins', bonusPepins: 11 },
  {
    stamps: 13,
    label: '1 produit offert (≤ 49 TND) + −50 % sur un 2e + 13 pépins',
    bonusPepins: 13,
  },
];

export function availableStops(cardStamps: number): CardStop[] {
  return CARD_STOPS.filter((s) => s.stamps <= cardStamps);
}

export function addStamps(card: number, added: number): number {
  return Math.min(CARD_MAX, card + added);
}

export function resetValue(level: number): 0 | 1 | 2 {
  if (level >= 23) return 2;
  if (level >= 17) return 1;
  return 0;
}

export type PerkKind = 'auto' | 'once' | 'yearly' | 'ongoing';

export interface Perk {
  level: number;
  label: string;
  kind: PerkKind;
}

export const PERKS: readonly Perk[] = [
  { level: 2, label: 'Échantillon de bienvenue', kind: 'once' },
  { level: 3, label: 'Un échantillon offert', kind: 'once' },
  { level: 5, label: 'Huile de figue de barbarie 10 ml offerte', kind: 'once' },
  { level: 7, label: '−20 % pendant le mois de votre anniversaire', kind: 'ongoing' },
  { level: 11, label: 'Emballage cadeau offert', kind: 'ongoing' },
  { level: 13, label: 'Pépins ×2, vous devenez Fleur', kind: 'auto' },
  { level: 17, label: 'Votre carte redémarre à 1 tampon', kind: 'auto' },
  { level: 19, label: 'Tampons doublés le jour de votre anniversaire', kind: 'auto' },
  { level: 23, label: 'Votre carte redémarre à 2 tampons', kind: 'auto' },
  { level: 29, label: 'Livraison offerte sur kinzoils.com', kind: 'ongoing' },
  { level: 31, label: 'Votez pour le prochain produit', kind: 'ongoing' },
  { level: 34, label: 'Chaque nouveauté livrée gratuitement avant sa sortie', kind: 'ongoing' },
  { level: 37, label: 'Une carte cadeau à offrir à un proche', kind: 'once' },
  { level: 41, label: 'Un coffret offert chaque année', kind: 'yearly' },
  { level: 43, label: "Visite de l'atelier et rencontre avec les fondateurs", kind: 'once' },
  { level: 47, label: '−10 % permanent', kind: 'ongoing' },
  {
    level: 50,
    label: 'Votre nom sur le Mur des Légendes + une édition limitée co-créée',
    kind: 'once',
  },
];

export function perksUnlocked(level: number): Perk[] {
  return PERKS.filter((p) => p.level <= level);
}

export function nextPerk(level: number): Perk | null {
  return PERKS.find((p) => p.level > level) ?? null;
}
