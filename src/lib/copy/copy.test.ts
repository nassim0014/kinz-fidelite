import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/server/errors';
import { CARD_STOPS, MAX_LEVEL, PERKS, title } from '../rules';
import { reminderMessage } from '../reminders';
import { errorText, getCopy, titleFor } from './index';

const fr = getCopy('fr');

describe('French dictionary', () => {
  it('names every level exactly like the game rules', () => {
    expect(titleFor(fr, 1)).toBe('Graine');
    expect(titleFor(fr, 12)).toBe('Raquette');
    expect(titleFor(fr, 50)).toBe('Légende du Figuier d’Or');
    for (let level = 1; level <= MAX_LEVEL; level++) expect(titleFor(fr, level)).toBe(title(level));
  });

  it('labels every reward and perk like the game rules', () => {
    for (const s of CARD_STOPS) expect(fr.stops[s.stamps]).toBe(s.label);
    for (const p of PERKS) expect(fr.perks[p.level]).toBe(p.label);
  });

  it('turns API error codes into the customer message', () => {
    expect(errorText(fr, 'PHONE_TAKEN')).toBe(MESSAGES.PHONE_TAKEN);
    expect(errorText(fr, 'XYZ')).toBe(fr.errors.UNKNOWN);
    expect(errorText(fr, undefined)).toBe(fr.errors.UNKNOWN);
  });
});

const keysOf = (o: object) => Object.keys(o).sort();
const allStrings = (v: unknown): string[] => {
  if (typeof v === 'string') return [v];
  if (typeof v === 'function') {
    const out = (v as (...a: unknown[]) => unknown)(2, 2, 3);
    return typeof out === 'string' ? [out] : [];
  }
  if (v && typeof v === 'object') return Object.values(v).flatMap(allStrings);
  return [];
};

describe('Tounsi, English and Arabic dictionaries', () => {
  for (const l of ['tn', 'en', 'ar'] as const) {
    const copy = getCopy(l);
    it(`${l} is a real translation with every reward, perk and title`, () => {
      expect(copy).not.toBe(fr);
      expect(keysOf(copy.stops)).toEqual(keysOf(fr.stops));
      expect(keysOf(copy.perks)).toEqual(keysOf(fr.perks));
      expect(keysOf(copy.titles)).toEqual(keysOf(fr.titles));
      expect(keysOf(copy.strip.short)).toEqual(keysOf(fr.strip.short));
    });

    it(`${l} reminders keep the first name and the card link`, () => {
      for (const reason of [
        'reward_waiting',
        'one_stamp_away',
        'birthday_month',
        'dormant',
      ] as const) {
        const text = reminderMessage(
          reason,
          { firstName: 'Salma', cardStamps: 4, cardUrl: 'https://f.tn/c/x' },
          l,
        );
        expect(text).toContain('Salma');
        expect(text).toContain('https://f.tn/c/x');
      }
    });

    it(`${l} has no em dash`, () => {
      expect(allStrings(copy).some((s) => s.includes('\u2014'))).toBe(false);
    });
  }

  it('uses the agreed level names in English and Arabic', () => {
    expect(getCopy('en').titles).toEqual({
      1: 'Seed',
      5: 'Sprout',
      8: 'Pad',
      13: 'Flower',
      21: 'Fig',
      34: 'Fig Tree',
      50: 'Legend of the Golden Fig Tree',
    });
    expect(getCopy('ar').titles).toEqual({
      1: 'بذرة',
      5: 'نبتة',
      8: 'لوح الصبار',
      13: 'زهرة',
      21: 'تينة',
      34: 'شجرة التين',
      50: 'أسطورة شجرة التين الذهبية',
    });
  });
});

describe('Arabic layout', () => {
  it('keeps amounts and multipliers left-to-right inside Arabic text', () => {
    const strings = allStrings(getCopy('ar'));
    // Remove the isolated runs, then nothing that reads left-to-right may be left.
    const loose = strings.filter((s) =>
      /\d+ TND|×\d|[−-]\d+ ?%/.test(s.replace(/\u2066[^\u2069]*\u2069/g, '')),
    );
    expect(loose).toEqual([]);
  });
});
