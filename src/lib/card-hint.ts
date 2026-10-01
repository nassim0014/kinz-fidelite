import { CARD_MAX, CARD_STOPS, type CardStop } from './rules';

export interface CardHint {
  /** Best reward the customer can claim right now, if any. */
  available: CardStop | null;
  /** Next reward further along the card, with how many stamps it still needs. */
  next: { stop: CardStop; missing: number } | null;
  full: boolean;
}

export function cardHint(cardStamps: number): CardHint {
  const reached = CARD_STOPS.filter((s) => s.stamps <= cardStamps);
  const upcoming = CARD_STOPS.find((s) => s.stamps > cardStamps);
  return {
    available: reached.at(-1) ?? null,
    next: upcoming ? { stop: upcoming, missing: upcoming.stamps - cardStamps } : null,
    full: cardStamps >= CARD_MAX,
  };
}

export const stampsWord = (n: number): string => (n === 1 ? 'tampon' : 'tampons');
