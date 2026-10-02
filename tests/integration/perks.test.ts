import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { customers } from '@/db/schema';
import { getStaffView, givablePerks, givePerk } from '@/server/perks';
import { stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';

const NOW = new Date('2026-10-01T10:00:00Z');
const NEXT_YEAR = new Date('2027-10-01T10:00:00Z');

describe('manual perks', () => {
  it('lists unlocked once/yearly perks not yet given', async () => {
    const c = await makeCustomer({ lifetimePepins: 10 }); // level 5
    expect((await givablePerks(testDb, c, NOW)).map((p) => p.level)).toEqual([2, 3, 5]);
  });

  it('gives a once perk only once', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 10 });
    await givePerk(testDb, { customerId: c.id, perkLevel: 5, staffId: s.id, now: NOW });
    await expect(
      givePerk(testDb, { customerId: c.id, perkLevel: 5, staffId: s.id, now: NOW }),
    ).rejects.toMatchObject({ code: 'PERK_ALREADY_GIVEN' });
    expect((await givablePerks(testDb, c, NOW)).map((p) => p.level)).toEqual([2, 3]);
  });

  it('gives the yearly perk again the next year', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 820 }); // level 41
    await givePerk(testDb, { customerId: c.id, perkLevel: 41, staffId: s.id, now: NOW });
    expect((await givablePerks(testDb, c, NOW)).some((p) => p.level === 41)).toBe(false);
    expect((await givablePerks(testDb, c, NEXT_YEAR)).some((p) => p.level === 41)).toBe(true);
  });

  it('refuses locked, automatic, ongoing and unknown perks', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 10 });
    await expect(
      givePerk(testDb, { customerId: c.id, perkLevel: 37, staffId: s.id }),
    ).rejects.toMatchObject({ code: 'PERK_LOCKED' });
    const rich = await makeCustomer({ lifetimePepins: 1225 });
    for (const perkLevel of [13, 11, 4]) {
      await expect(
        givePerk(testDb, { customerId: rich.id, perkLevel, staffId: s.id }),
      ).rejects.toMatchObject({ code: 'PERK_NOT_GIVABLE' });
    }
  });
});

describe('getStaffView', () => {
  it('reports whether the customer was already stamped today', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    expect((await getStaffView(testDb, c, NOW)).stampedToday).toBe(false);
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: NOW });
    const v = await getStaffView(testDb, c, NOW);
    expect(v).toMatchObject({ customerId: c.id, phone: c.phone, stampedToday: true });
  });
});

describe('getStaffView language', () => {
  it("shows the counter the customer's language", async () => {
    const c = await makeCustomer();
    await testDb.update(customers).set({ locale: 'tn' }).where(eq(customers.id, c.id));
    const [fresh] = await testDb.select().from(customers).where(eq(customers.id, c.id));
    expect((await getStaffView(testDb, fresh!)).locale).toBe('tn');
  });
});
