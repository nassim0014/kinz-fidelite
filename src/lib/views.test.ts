import { expect, it } from 'vitest';
import type { Customer } from '@/db/schema';
import { buildCardView } from './views';

const base: Customer = {
  id: '00000000-0000-0000-0000-000000000001',
  token: 'AbCdEfGhIjKlMnOpQrSt_-',
  firstName: 'Salma',
  phone: '+21622123456',
  birthday: null,
  address: null,
  cardStamps: 6,
  lifetimePepins: 80,
  createdAt: new Date('2026-09-30T10:00:00Z'),
};

it('builds the card view from a customer row', () => {
  const v = buildCardView(base);
  expect(v.cardStamps).toBe(6);
  expect(v.cardMax).toBe(13);
  expect(v.stops.filter((s) => s.reached).map((s) => s.stamps)).toEqual([3, 5]);
  expect(v).toMatchObject({
    level: 13,
    title: 'Fleur',
    multiplier: 2,
    progress: { intoLevel: 2, levelCost: 13 },
  });
  expect(v.nextPerk?.level).toBe(17);
  expect(v.needsAddress).toBe(false);
});

it('asks Figuiers (level 34+) for a delivery address until they give one', () => {
  expect(buildCardView({ ...base, lifetimePepins: 561 }).needsAddress).toBe(true);
  expect(buildCardView({ ...base, lifetimePepins: 561, address: 'Tunis' }).needsAddress).toBe(
    false,
  );
});

it('shows the birthday perk the customer has earned', () => {
  const born = { ...base, birthday: '1990-10-02' };
  const day = new Date('2026-10-02T10:00:00Z');
  const laterThatMonth = new Date('2026-10-05T10:00:00Z');
  expect(buildCardView({ ...born, lifetimePepins: 171 }, day).birthdayPerk).toBe('day');
  expect(buildCardView({ ...born, lifetimePepins: 171 }, laterThatMonth).birthdayPerk).toBe(
    'month',
  );
  expect(buildCardView({ ...born, lifetimePepins: 15 }, day).birthdayPerk).toBeNull();
  expect(buildCardView({ ...base, lifetimePepins: 171 }, day).birthdayPerk).toBeNull();
});
