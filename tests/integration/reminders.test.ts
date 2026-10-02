import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { customers, events } from '@/db/schema';
import { businessDate } from '@/lib/dates';
import { exportEventsCsv, listEvents } from '@/server/admin';
import { listReminderCandidates, recordReminder } from '@/server/reminders';
import { makeCustomer, makeStaff, testDb } from './helpers';

const now = new Date('2026-10-02T10:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

async function visit(customerId: string, staffId: string, at: Date) {
  await testDb.insert(events).values({
    customerId,
    staffId,
    type: 'stamp',
    amountTnd: '50',
    stampsDelta: 1,
    pepinsDelta: 1,
    businessDate: businessDate(at),
    createdAt: at,
  });
}

async function signedUp(customerId: string, at: Date) {
  await testDb.update(customers).set({ createdAt: at }).where(eq(customers.id, customerId));
}

describe('reminder candidates', () => {
  it('lists a waiting reward, skips a recent visitor, and hides a reminded customer', async () => {
    const s = await makeStaff('Nassim', 'owner');
    const salma = await makeCustomer({ firstName: 'Salma', cardStamps: 3 });
    const leila = await makeCustomer({ firstName: 'Leila', cardStamps: 3 });
    await signedUp(salma.id, daysAgo(60));
    await signedUp(leila.id, daysAgo(60));
    await visit(salma.id, s.id, daysAgo(30));
    await visit(leila.id, s.id, daysAgo(1));

    const list = await listReminderCandidates(testDb, now);
    expect(list).toEqual([
      expect.objectContaining({
        customerId: salma.id,
        firstName: 'Salma',
        token: salma.token,
        phone: salma.phone,
        cardStamps: 3,
        reason: 'reward_waiting',
      }),
    ]);

    expect(
      await recordReminder(testDb, {
        customerId: salma.id,
        reason: 'reward_waiting',
        staffId: s.id,
        now,
      }),
    ).toEqual({ recorded: true });
    const [logged] = await testDb
      .select()
      .from(events)
      .where(and(eq(events.customerId, salma.id), eq(events.type, 'reminder_sent')));
    expect(logged).toMatchObject({
      detail: 'reward_waiting',
      stampsDelta: 0,
      pepinsDelta: 0,
      businessDate: businessDate(now),
    });
    expect(await listReminderCandidates(testDb, now)).toEqual([]);
  });

  it('does not log a second reminder within 14 days', async () => {
    const s = await makeStaff('Nassim', 'owner');
    const c = await makeCustomer({ cardStamps: 3 });
    const input = { customerId: c.id, reason: 'reward_waiting' as const, staffId: s.id, now };
    expect(await recordReminder(testDb, input)).toEqual({ recorded: true });
    expect(await recordReminder(testDb, input)).toEqual({ recorded: false });
    const logged = await testDb
      .select()
      .from(events)
      .where(and(eq(events.customerId, c.id), eq(events.type, 'reminder_sent')));
    expect(logged).toHaveLength(1);
  });

  it('shows reminders in the admin journal and the CSV export', async () => {
    const s = await makeStaff('Nassim', 'owner');
    const c = await makeCustomer({ firstName: 'Amira' });
    await recordReminder(testDb, { customerId: c.id, reason: 'dormant', staffId: s.id, now });
    const [e] = await listEvents(testDb);
    expect(e).toMatchObject({ type: 'reminder_sent', customerName: 'Amira', detail: 'dormant' });
    expect(await exportEventsCsv(testDb)).toContain(';reminder_sent;Amira;');
  });
});
