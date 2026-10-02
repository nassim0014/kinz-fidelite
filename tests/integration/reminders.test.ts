import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { POST as reminderRoute } from '@/app/api/admin/reminders/route';
import { customers, events } from '@/db/schema';
import { businessDate } from '@/lib/dates';
import { exportEventsCsv, listEvents } from '@/server/admin';
import { listReminderCandidates, recordReminder, returnStats } from '@/server/reminders';
import { makeCustomer, makeStaff, testDb } from './helpers';
import { cookieFor, req } from './http';

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

describe('POST /api/admin/reminders', () => {
  it('is reserved to owners', async () => {
    const amel = await makeStaff('Amel', 'staff');
    const c = await makeCustomer();
    const res = await reminderRoute(
      req('/api/admin/reminders', {
        body: { customerId: c.id, reason: 'dormant' },
        cookie: await cookieFor(amel),
      }),
    );
    expect(res.status).toBe(403);
  });

  it('records once, then reports the reminder as already sent', async () => {
    const owner = await makeStaff('Nassim', 'owner');
    const c = await makeCustomer();
    const call = async () =>
      reminderRoute(
        req('/api/admin/reminders', {
          body: { customerId: c.id, reason: 'dormant' },
          cookie: await cookieFor(owner),
        }),
      );
    const first = await call();
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, recorded: true });
    expect(await (await call()).json()).toEqual({ ok: true, recorded: false });
  });

  it('rejects an unknown reason', async () => {
    const owner = await makeStaff('Nassim', 'owner');
    const c = await makeCustomer();
    const res = await reminderRoute(
      req('/api/admin/reminders', {
        body: { customerId: c.id, reason: 'autre' },
        cookie: await cookieFor(owner),
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('returnStats', () => {
  it('counts returning customers and reminders followed by a visit', async () => {
    const s = await makeStaff('Nassim', 'owner');
    const a = await makeCustomer({ firstName: 'A' });
    const b = await makeCustomer({ firstName: 'B' });
    const c = await makeCustomer({ firstName: 'C' });
    await visit(a.id, s.id, daysAgo(20));
    await visit(a.id, s.id, daysAgo(3));
    await visit(b.id, s.id, daysAgo(3));
    await recordReminder(testDb, {
      customerId: c.id,
      reason: 'dormant',
      staffId: s.id,
      now: daysAgo(10),
    });
    await visit(c.id, s.id, daysAgo(5));
    expect(await returnStats(testDb, now)).toEqual({
      customers: 3,
      returning: 1,
      reminders90d: 1,
      remindersFollowed: 1,
    });
  });
});
