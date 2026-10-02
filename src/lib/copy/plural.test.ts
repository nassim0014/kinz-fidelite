import { expect, it } from 'vitest';
import { plural } from './plural';

it('uses the six Arabic plural forms', () => {
  const forms = { zero: 'zero', one: 'one', two: 'two', few: 'few', many: 'many', other: 'other' };
  expect([0, 1, 2, 3, 10, 11, 99, 100].map((n) => plural('ar', n, forms))).toEqual([
    'zero',
    'one',
    'two',
    'few',
    'few',
    'many',
    'many',
    'other',
  ]);
});

it('treats 0 as singular in French and Tounsi', () => {
  for (const l of ['fr', 'tn'] as const) {
    expect(plural(l, 0, { one: 'a', other: 'b' })).toBe('a');
    expect(plural(l, 2, { one: 'a', other: 'b' })).toBe('b');
  }
});

it('falls back to the other form when one is missing', () => {
  expect(plural('ar', 5, { other: 'x' })).toBe('x');
});
