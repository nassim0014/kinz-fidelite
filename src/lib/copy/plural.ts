import type { Locale } from './locale';

export type PluralForms = { other: string } & Partial<Record<Intl.LDMLPluralRule, string>>;

const rules = new Map<Locale, Intl.PluralRules>();

/** Picks the grammatical form for `n`; Tounsi follows the French rules. */
export function plural(locale: Locale, n: number, forms: PluralForms): string {
  let r = rules.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale === 'tn' ? 'fr' : locale);
    rules.set(locale, r);
  }
  return forms[r.select(n)] ?? forms.other;
}
