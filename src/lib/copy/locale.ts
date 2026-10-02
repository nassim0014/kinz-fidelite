/** The four languages of the customer screens. French is the reference and the default. */
export const LOCALES = ['fr', 'tn', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = 'kinz_lang';

export const LOCALE_DIR: Record<Locale, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  tn: 'ltr',
  en: 'ltr',
  ar: 'rtl',
};

/** BCP 47 tag for the `lang` attribute: `tn` alone would mean Setswana. */
export const LOCALE_LANG: Record<Locale, string> = {
  fr: 'fr',
  tn: 'aeb-Latn',
  en: 'en',
  ar: 'ar',
};

/** Each option is written in its own language. */
export const LOCALE_LABEL: Record<Locale, string> = {
  fr: 'FR',
  tn: 'Tounsi',
  en: 'EN',
  ar: 'عربي',
};

export function parseLocale(v: unknown): Locale | null {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
}

/** No browser announces Tunisian, so `tn` is only ever chosen, never detected. */
export function detectLocale(acceptLanguage: string | null): Locale {
  const first = (acceptLanguage ?? '').split(',')[0]!.split(';')[0]!.trim().toLowerCase();
  if (first.startsWith('ar')) return 'ar';
  if (first.startsWith('en')) return 'en';
  return 'fr';
}

export function localeFromRequest(
  cookieValue: string | undefined,
  acceptLanguage: string | null,
): Locale {
  return parseLocale(cookieValue) ?? detectLocale(acceptLanguage);
}
