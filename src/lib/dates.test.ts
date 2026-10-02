import { describe, expect, it } from 'vitest';
import {
  businessDate,
  isBirthday,
  isBirthdayMonth,
  isValidBirthday,
  parseDayMonthYear,
} from './dates';

describe('businessDate (Africa/Tunis, UTC+1)', () => {
  it('rolls over at Tunis midnight, not UTC midnight', () => {
    expect(businessDate(new Date('2026-09-30T22:59:00Z'))).toBe('2026-09-30');
    expect(businessDate(new Date('2026-09-30T23:30:00Z'))).toBe('2026-10-01');
  });
});

describe('isBirthday', () => {
  const at = (iso: string) => new Date(iso);
  it('matches month and day in Tunis time', () => {
    expect(isBirthday('1990-10-01', at('2026-09-30T23:30:00Z'))).toBe(true);
    expect(isBirthday('1990-10-01', at('2026-10-02T10:00:00Z'))).toBe(false);
    expect(isBirthday(null, at('2026-10-01T10:00:00Z'))).toBe(false);
  });
  it('celebrates 29 February on 28 February in non-leap years', () => {
    expect(isBirthday('2000-02-29', at('2027-02-28T10:00:00Z'))).toBe(true);
    expect(isBirthday('2000-02-29', at('2028-02-28T10:00:00Z'))).toBe(false);
    expect(isBirthday('2000-02-29', at('2028-02-29T10:00:00Z'))).toBe(true);
  });
});

describe('isValidBirthday', () => {
  const now = new Date('2026-09-30T10:00:00Z');
  it.each([
    ['1990-10-01', true],
    ['2026-02-31', false],
    ['1899-12-31', false],
    ['2027-01-01', false],
    ['01/10/1990', false],
  ])('%s → %s', (value, expected) => {
    expect(isValidBirthday(value, now)).toBe(expected);
  });
});

describe('isBirthdayMonth', () => {
  it('detects the birthday month in Tunis time', () => {
    expect(isBirthdayMonth('1990-03-14', new Date('2026-03-01T00:30:00+01:00'))).toBe(true);
    // Already 1 March in Tunis.
    expect(isBirthdayMonth('1990-03-14', new Date('2026-02-28T23:30:00Z'))).toBe(true);
    expect(isBirthdayMonth('1990-03-14', new Date('2026-04-01T10:00:00Z'))).toBe(false);
    expect(isBirthdayMonth(null)).toBe(false);
  });
});

describe('parseDayMonthYear', () => {
  it('reads dd/mm/yyyy, the way dates are written in Tunisia', () => {
    expect(parseDayMonthYear('14/03/1990')).toBe('1990-03-14');
    expect(parseDayMonthYear('1/3/1990')).toBe('1990-03-01');
    expect(parseDayMonthYear('14-03-1990')).toBe('1990-03-14');
    expect(parseDayMonthYear(' 14.03.1990 ')).toBe('1990-03-14');
  });
  it('refuses impossible or partial dates', () => {
    for (const bad of ['31/02/1990', '14/13/1990', '03/14', '1990-03-14', 'abc', ''])
      expect(parseDayMonthYear(bad)).toBeNull();
  });
});
