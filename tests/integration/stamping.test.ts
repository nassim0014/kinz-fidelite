import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { customers, events } from '@/db/schema';
import { redeem, stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';

const DAY1 = new Date('2026-10-01T10:00:00Z');
const DAY2 = new Date('2026-10-02T10:00:00Z');

describe('stamp', () => {
  it('adds tampons and pépins and records the event', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 85.5, staffId: s.id, now: DAY1 });
    expect(r).toEqual({
      stampsAdded: 1,
      pepinsAdded: 2,
      cardStamps: 1,
      lifetimePepins: 2,
      levelBefore: 1,
      levelAfter: 2,
      cardFull: false,
    });
    const [e] = await testDb.select().from(events).where(eq(events.customerId, c.id));
    expect(e).toMatchObject({
      type: 'stamp',
      amountTnd: '85.500',
      stampsDelta: 1,
      pepinsDelta: 2,
      businessDate: '2026-10-01',
    });
  });

  it('gives 2 tampons from 120 TND and 3 from 300 TND', async () => {
    const s = await makeStaff();
    const a = await makeCustomer();
    const b = await makeCustomer();
    expect(
      (await stamp(testDb, { customerId: a.id, amountTnd: 120, staffId: s.id, now: DAY1 }))
        .stampsAdded,
    ).toBe(2);
    expect(
      (await stamp(testDb, { customerId: b.id, amountTnd: 300, staffId: s.id, now: DAY1 }))
        .stampsAdded,
    ).toBe(3);
  });

  it('refuses amounts under 40 TND and over 5000 TND', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    await expect(
      stamp(testDb, { customerId: c.id, amountTnd: 39.9, staffId: s.id, now: DAY1 }),
    ).rejects.toMatchObject({ code: 'AMOUNT_TOO_LOW' });
    await expect(
      stamp(testDb, { customerId: c.id, amountTnd: 8550, staffId: s.id, now: DAY1 }),
    ).rejects.toMatchObject({ code: 'AMOUNT_TOO_HIGH' });
  });

  it('refuses a second stamp the same Tunis day but accepts the next day', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 });
    await expect(
      stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 }),
    ).rejects.toMatchObject({ code: 'ALREADY_STAMPED' });
    expect(
      (await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY2 }))
        .cardStamps,
    ).toBe(2);
  });

  it('records exactly one stamp when two scans race', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const results = await Promise.allSettled([
      stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 }),
      stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id, now: DAY1 }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason.code).toBe('ALREADY_STAMPED');
    const [row] = await testDb.select().from(customers).where(eq(customers.id, c.id));
    expect(row!.cardStamps).toBe(1);
  });

  it('uses the multiplier of the level before the purchase', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 77 }); // level 12, ×1
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 80, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ pepinsAdded: 2, levelBefore: 12, levelAfter: 13 });
  });

  it('caps the card at 13 and flags it full', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 12 });
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 300, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stampsAdded: 1, cardStamps: 13, cardFull: true });
  });

  it('doubles tampons on the birthday from level 19', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ lifetimePepins: 171, birthday: '1990-10-01' }); // level 19
    const r = await stamp(testDb, { customerId: c.id, amountTnd: 40, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stampsAdded: 2, pepinsAdded: 2 });
  });

  it('reports an unknown customer', async () => {
    const s = await makeStaff();
    await expect(
      stamp(testDb, {
        customerId: '00000000-0000-0000-0000-000000000000',
        amountTnd: 50,
        staffId: s.id,
        now: DAY1,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('redeem', () => {
  it('uses a reached stop and resets the card to 0', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 6 });
    const r = await redeem(testDb, { customerId: c.id, stop: 5, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ stop: 5, bonusPepins: 0, cardStamps: 0 });
  });

  it('refuses a stop that is not reached or does not exist', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 6 });
    await expect(
      redeem(testDb, { customerId: c.id, stop: 7, staffId: s.id }),
    ).rejects.toMatchObject({ code: 'STOP_NOT_REACHED' });
    await expect(
      redeem(testDb, { customerId: c.id, stop: 4, staffId: s.id }),
    ).rejects.toMatchObject({ code: 'STOP_NOT_REACHED' });
  });

  it('adds bonus pépins at 13, records a bonus event, and restarts at 2 from level 23', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 13, lifetimePepins: 253 }); // level 23
    const r = await redeem(testDb, { customerId: c.id, stop: 13, staffId: s.id, now: DAY1 });
    expect(r).toMatchObject({ bonusPepins: 13, lifetimePepins: 266, cardStamps: 2 });
    const types = (await testDb.select().from(events).where(eq(events.customerId, c.id)))
      .map((e) => e.type)
      .sort();
    expect(types).toEqual(['bonus', 'redeem']);
  });
});
