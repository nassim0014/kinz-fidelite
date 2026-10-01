import { expect, it } from 'vitest';
import { toCsv } from './csv';

it('writes a semicolon CSV with BOM for French Excel', () => {
  expect(toCsv([{ prenom: 'Salma', pepins: 12 }])).toBe('﻿prenom;pepins\r\nSalma;12\r\n');
});

it('quotes separators, quotes and line breaks', () => {
  expect(toCsv([{ adresse: '12 rue "X"; Tunis\nBis' }])).toBe(
    '﻿adresse\r\n"12 rue ""X""; Tunis\nBis"\r\n',
  );
});

it('neutralises spreadsheet formulas in text but not in numbers', () => {
  const csv = toCsv([{ prenom: '=HYPERLINK("x")', delta: -7 }]);
  expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  expect(csv).toContain(';-7');
});

it('returns an empty string for no rows', () => {
  expect(toCsv([])).toBe('');
});
