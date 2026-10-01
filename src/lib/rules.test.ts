import { describe, expect, it } from 'vitest';
import {
  CARD_STOPS,
  PERKS,
  addStamps,
  availableStops,
  isFibonacci,
  isGolden,
  isPrime,
  levelFromPepins,
  levelProgress,
  multiplier,
  nextPerk,
  pepinsFor,
  pepinsToReach,
  perksUnlocked,
  resetValue,
  stampsFor,
  stampsForVisit,
  title,
} from './rules';

describe('number helpers', () => {
  it('detects primes', () => {
    expect([1, 2, 3, 4, 9, 13, 47, 49].map(isPrime)).toEqual([
      false,
      true,
      true,
      false,
      false,
      true,
      true,
      false,
    ]);
  });
  it('detects Fibonacci numbers', () => {
    expect([1, 2, 3, 4, 5, 8, 13, 21, 34, 50].map(isFibonacci)).toEqual([
      true,
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true,
      false,
    ]);
  });
  it('golden = prime AND Fibonacci: exactly 2, 3, 5, 13 up to 50', () => {
    const golden = Array.from({ length: 50 }, (_, i) => i + 1).filter(isGolden);
    expect(golden).toEqual([2, 3, 5, 13]);
  });
});

describe('stamps per receipt', () => {
  it.each([
    [39.999, 0],
    [40, 1],
    [119.999, 1],
    [120, 2],
    [299.999, 2],
    [300, 3],
    [5000, 3],
  ])('%s TND → %s tampon(s)', (amount, expected) => {
    expect(stampsFor(amount)).toBe(expected);
  });
  it('doubles tampons on birthday from level 19', () => {
    expect(stampsForVisit(130, 19, true)).toBe(4);
    expect(stampsForVisit(130, 18, true)).toBe(2);
    expect(stampsForVisit(130, 19, false)).toBe(2);
  });
});

describe('pépins and levels', () => {
  it('uses Fibonacci multipliers switching at levels 13, 21 and 34', () => {
    expect([1, 12, 13, 20, 21, 33, 34, 50].map(multiplier)).toEqual([1, 1, 2, 2, 3, 3, 5, 5]);
  });
  it('earns floor(total/40) × multiplier', () => {
    expect(pepinsFor(39, 1)).toBe(0);
    expect(pepinsFor(85.5, 1)).toBe(2);
    expect(pepinsFor(85.5, 13)).toBe(4);
    expect(pepinsFor(400, 34)).toBe(50);
  });
  it('level L costs L(L−1)/2 pépins in total', () => {
    expect([1, 2, 13, 50].map(pepinsToReach)).toEqual([0, 1, 78, 1225]);
  });
  it('derives the level from lifetime pépins, capped at 50', () => {
    expect([0, 1, 2, 3, 77, 78, 1224, 1225, 99999].map(levelFromPepins)).toEqual([
      1, 2, 2, 3, 12, 13, 49, 50, 50,
    ]);
  });
  it('reports progress inside the current level', () => {
    expect(levelProgress(80)).toEqual({ level: 13, intoLevel: 2, levelCost: 13 });
    expect(levelProgress(1300)).toEqual({ level: 50, intoLevel: 75, levelCost: null });
  });
  it('names each level band', () => {
    expect([1, 4, 5, 7, 8, 12, 13, 20, 21, 33, 34, 49, 50].map(title)).toEqual([
      'Graine',
      'Graine',
      'Pousse',
      'Pousse',
      'Raquette',
      'Raquette',
      'Fleur',
      'Fleur',
      'Figue',
      'Figue',
      'Figuier',
      'Figuier',
      'Légende du Figuier d’Or',
    ]);
  });
});

describe('card', () => {
  it('places every stop on a prime number', () => {
    expect(CARD_STOPS.map((s) => s.stamps)).toEqual([3, 5, 7, 11, 13]);
    expect(CARD_STOPS.every((s) => isPrime(s.stamps))).toBe(true);
  });
  it('gives bonus pépins only at 11 and 13', () => {
    expect(CARD_STOPS.map((s) => s.bonusPepins)).toEqual([0, 0, 0, 11, 13]);
  });
  it('lists the stops the customer can use', () => {
    expect(availableStops(0)).toEqual([]);
    expect(availableStops(6).map((s) => s.stamps)).toEqual([3, 5]);
    expect(availableStops(13)).toHaveLength(5);
  });
  it('caps the card at 13', () => {
    expect(addStamps(12, 3)).toBe(13);
    expect(addStamps(13, 1)).toBe(13);
    expect(addStamps(4, 2)).toBe(6);
  });
  it('restarts the card at 1 from level 17 and at 2 from level 23', () => {
    expect([16, 17, 22, 23, 50].map(resetValue)).toEqual([0, 1, 1, 2, 2]);
  });
});

describe('perks', () => {
  it('sits every perk on a prime or Fibonacci level, or on 50', () => {
    expect(PERKS.every((p) => isPrime(p.level) || isFibonacci(p.level) || p.level === 50)).toBe(
      true,
    );
  });
  it('unlocks perks cumulatively and names the next one', () => {
    expect(perksUnlocked(4).map((p) => p.level)).toEqual([2, 3]);
    expect(nextPerk(4)?.level).toBe(5);
    expect(nextPerk(50)).toBeNull();
  });
  it('flags the automatic perks', () => {
    expect(PERKS.filter((p) => p.kind === 'auto').map((p) => p.level)).toEqual([
      13, 17, 19, 21, 23,
    ]);
  });
});
