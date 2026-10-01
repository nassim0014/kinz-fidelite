import { expect, it } from 'vitest';
import { parseAmount } from './amount';

it.each([
  ['85', 85],
  ['85,500', 85.5],
  ['85.5', 85.5],
  [' 1 250 ', 1250],
  ['1 250,000', 1250],
  ['40', 40],
])('parses %j', (input, expected) => {
  expect(parseAmount(input)).toBe(expected);
});

it.each(['', 'abc', '85.5 TND', '1.250,000', '-40', '85,5555', '1e3'])('rejects %j', (input) => {
  expect(parseAmount(input)).toBeNull();
});
