import { describe, expect, it } from 'vitest';
import { businessDate, isBirthday, isValidBirthday } from './dates';

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
