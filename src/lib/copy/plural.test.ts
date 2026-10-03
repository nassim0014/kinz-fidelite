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

it('treats 0 as singular in French only', () => {
  expect(plural('fr', 0, { one: 'a', other: 'b' })).toBe('a');
  expect(plural('fr', 2, { one: 'a', other: 'b' })).toBe('b');
});

it('says "0 pépins" in Tounsi, like Nassim writes it', () => {
  expect(plural('tn', 0, { one: 'pépin', other: 'pépins' })).toBe('pépins');
  expect(plural('tn', 1, { one: 'pépin', other: 'pépins' })).toBe('pépin');
  expect(plural('tn', 2, { one: 'pépin', other: 'pépins' })).toBe('pépins');
});

it('falls back to the other form when one is missing', () => {
  expect(plural('ar', 5, { other: 'x' })).toBe('x');
});
