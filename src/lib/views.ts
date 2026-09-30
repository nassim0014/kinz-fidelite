import type { Customer } from '@/db/schema';
import {
  CARD_MAX,
  CARD_STOPS,
  type CardStop,
  levelProgress,
  multiplier,
  nextPerk,
  type Perk,
  perksUnlocked,
  title,
} from './rules';

export interface CardView {
  token: string;
  firstName: string;
  cardStamps: number;
  cardMax: number;
  stops: Array<CardStop & { reached: boolean }>;
  level: number;
  title: string;
  multiplier: number;
  lifetimePepins: number;
  progress: { intoLevel: number; levelCost: number | null };
  perks: Perk[];
  nextPerk: Perk | null;
  needsAddress: boolean;
}

export interface StaffCustomerView {
  customerId: string;
  phone: string;
  card: CardView;
  stampedToday: boolean;
  givablePerks: Perk[];
}

export interface StampResult {
  stampsAdded: number;
  pepinsAdded: number;
  cardStamps: number;
  lifetimePepins: number;
  levelBefore: number;
  levelAfter: number;
  cardFull: boolean;
}

export interface RedeemResult {
  stop: number;
  label: string;
  bonusPepins: number;
  cardStamps: number;
  lifetimePepins: number;
  levelAfter: number;
}

export function buildCardView(c: Customer): CardView {
  const { level, intoLevel, levelCost } = levelProgress(c.lifetimePepins);
  return {
    token: c.token,
    firstName: c.firstName,
    cardStamps: c.cardStamps,
    cardMax: CARD_MAX,
    stops: CARD_STOPS.map((s) => ({ ...s, reached: s.stamps <= c.cardStamps })),
    level,
    title: title(level),
    multiplier: multiplier(level),
    lifetimePepins: c.lifetimePepins,
    progress: { intoLevel, levelCost },
    perks: perksUnlocked(level),
    nextPerk: nextPerk(level),
    needsAddress: level >= 34 && !c.address,
  };
}
