import { describe, expect, it } from 'vitest';
import { detectLocale, LOCALE_LANG, localeFromRequest, parseLocale } from './locale';

describe('parseLocale', () => {
  it('accepts the four languages only', () => {
    expect(parseLocale('tn')).toBe('tn');
    for (const bad of ['xx', '', undefined, 42]) expect(parseLocale(bad)).toBeNull();
  });
});

describe('detectLocale', () => {
  it('follows the first language the phone asks for', () => {
    expect(detectLocale('ar-TN,ar;q=0.9,fr;q=0.8')).toBe('ar');
    expect(detectLocale('en-US,en;q=0.9')).toBe('en');
    expect(detectLocale('fr-FR')).toBe('fr');
  });
  it('falls back to French', () => {
    expect(detectLocale('de-DE')).toBe('fr');
    expect(detectLocale(null)).toBe('fr');
    expect(detectLocale('')).toBe('fr');
  });
});

describe('localeFromRequest', () => {
  it('prefers a valid cookie, then the phone language', () => {
    expect(localeFromRequest('tn', 'ar')).toBe('tn');
    expect(localeFromRequest('xx', 'en-US')).toBe('en');
    expect(localeFromRequest(undefined, null)).toBe('fr');
  });
});

describe('LOCALE_LANG', () => {
  it('gives the browser a real language tag for Tounsi', () => {
    expect(LOCALE_LANG).toEqual({ fr: 'fr', tn: 'aeb-Latn', en: 'en', ar: 'ar' });
  });
});
