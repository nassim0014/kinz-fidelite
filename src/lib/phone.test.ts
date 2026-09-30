import { expect, it } from 'vitest';
import { normalizeTunisianPhone } from './phone';

it.each([
  ['22 123 456', '+21622123456'],
  ['+216 22 123 456', '+21622123456'],
  ['0021698765432', '+21698765432'],
  ['71.234.567', '+21671234567'],
])('normalises %s', (input, expected) => {
  expect(normalizeTunisianPhone(input)).toBe(expected);
});

it.each(['1234567', '123456789', '12345678', 'abc', '+33612345678', ''])('rejects %s', (input) => {
  expect(normalizeTunisianPhone(input)).toBeNull();
});
