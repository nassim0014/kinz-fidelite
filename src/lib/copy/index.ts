import { buildRoadmap } from '../roadmap';
import { ar } from './ar';
import { en } from './en';
import { type Copy, fr } from './fr';
import type { Locale } from './locale';
import { tn } from './tn';

export type { Copy } from './fr';
export * from './locale';

const DICTIONARIES: Record<Locale, Copy> = { fr, tn, en, ar };

export function getCopy(locale: Locale): Copy {
  return DICTIONARIES[locale];
}

const STAGE_STARTS = buildRoadmap().stages.map((s) => s.from);

/** Name of the stage a level belongs to, in the reader's language. */
export function titleFor(copy: Copy, level: number): string {
  const start = STAGE_STARTS.filter((from) => from <= level).at(-1) ?? 1;
  return copy.titles[start as keyof Copy['titles']];
}

export function errorText(copy: Copy, code: unknown): string {
  return typeof code === 'string' && code in copy.errors
    ? copy.errors[code as keyof Copy['errors']]
    : copy.errors.UNKNOWN;
}

/** Splits a template around `{reward}` so the reward can be rendered in bold. */
export function splitReward(template: string): [string, string] {
  const [before = '', after = ''] = template.split('{reward}');
  return [before, after];
}
