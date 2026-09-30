import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';
import { customers, events, staff } from '@/db/schema';
import { testDb } from './helpers';

async function seed() {
  const [s] = await testDb
    .insert(staff)
    .values({ name: 'Amel', pinHash: await bcrypt.hash('123456', 4) })
    .returning();
  const [c] = await testDb
    .insert(customers)
    .values({ token: 'AbCdEfGhIjKlMnOpQrSt_-', firstName: 'Salma', phone: '+21622123456' })
    .returning();
  return { staffId: s!.id, customerId: c!.id };
}

describe('events_one_stamp_per_day', () => {
  it('rejects a second stamp for the same customer on the same business day', async () => {
    const { staffId, customerId } = await seed();
    const row = { customerId, staffId, type: 'stamp' as const, businessDate: '2026-10-01' };
    await testDb.insert(events).values(row);
    await expect(testDb.insert(events).values(row)).rejects.toThrow();
  });

  it('allows a redeem on the same day and a stamp on the next day', async () => {
    const { staffId, customerId } = await seed();
    await testDb
      .insert(events)
      .values({ customerId, staffId, type: 'stamp', businessDate: '2026-10-01' });
    await testDb
      .insert(events)
      .values({ customerId, staffId, type: 'redeem', businessDate: '2026-10-01' });
    await testDb
      .insert(events)
      .values({ customerId, staffId, type: 'stamp', businessDate: '2026-10-02' });
    expect(await testDb.$count(events)).toBe(3);
  });
});
