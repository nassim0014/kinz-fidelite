import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/server/errors';
import { CARD_STOPS, MAX_LEVEL, PERKS, title } from '../rules';
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
