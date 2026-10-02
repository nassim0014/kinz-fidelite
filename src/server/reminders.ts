import { and, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { customers, events } from '@/db/schema';
import { businessDate } from '@/lib/dates';
import { type ReminderReason, reminderReason } from '@/lib/reminders';

export interface ReminderCandidate {
  customerId: string;
  firstName: string;
  phone: string;
  token: string;
  cardStamps: number;
  reason: ReminderReason;
}

const ORDER: ReminderReason[] = ['reward_waiting', 'one_stamp_away', 'birthday_month', 'dormant'];
const SILENCE_MS = 14 * 86_400_000;

/** Every customer worth a nudge today, most useful reason first, longest absence first. */
export async function listReminderCandidates(
  db: Db,
  now: Date = new Date(),
): Promise<ReminderCandidate[]> {
  const rows = await db
    .select({
      customer: customers,
      lastVisitAt: sql<Date | null>`max(${events.createdAt}) filter (where ${events.type} = 'stamp')`,
      lastReminderAt: sql<Date | null>`max(${events.createdAt}) filter (where ${events.type} = 'reminder_sent')`,
    })
    .from(customers)
    .leftJoin(events, eq(events.customerId, customers.id))
    .groupBy(customers.id);

  const toDate = (v: Date | string | null) => (v === null ? null : new Date(v));
  return rows
    .flatMap(({ customer: c, lastVisitAt, lastReminderAt }) => {
      const lastVisit = toDate(lastVisitAt);
      const reason = reminderReason(
        { ...c, lastVisitAt: lastVisit, lastReminderAt: toDate(lastReminderAt) },
        now,
      );
      if (!reason) return [];
      const since = (lastVisit ?? c.createdAt).getTime();
      return [{ candidate: toCandidate(c, reason), since }];
    })
    .sort(
      (a, b) =>
        ORDER.indexOf(a.candidate.reason) - ORDER.indexOf(b.candidate.reason) || a.since - b.since,
    )
    .map((r) => r.candidate);
}

function toCandidate(c: typeof customers.$inferSelect, reason: ReminderReason): ReminderCandidate {
  return {
    customerId: c.id,
    firstName: c.firstName,
    phone: c.phone,
    token: c.token,
    cardStamps: c.cardStamps,
    reason,
  };
}

/** Logs a reminder; a second one within 14 days is ignored so a double click sends nothing twice. */
export async function recordReminder(
  db: Db,
  input: { customerId: string; reason: ReminderReason; staffId: string; now?: Date },
): Promise<{ recorded: boolean }> {
  const now = input.now ?? new Date();
  return db.transaction(async (tx) => {
    const recent = await tx
      .select({ id: events.id })
      .from(events)
      .where(
        and(
          eq(events.customerId, input.customerId),
          eq(events.type, 'reminder_sent'),
          gte(events.createdAt, new Date(now.getTime() - SILENCE_MS)),
        ),
      )
      .limit(1);
    if (recent.length > 0) return { recorded: false };
    await tx.insert(events).values({
      customerId: input.customerId,
      staffId: input.staffId,
      type: 'reminder_sent',
      detail: input.reason,
      businessDate: businessDate(now),
      createdAt: now,
    });
    return { recorded: true };
  });
}

/** Share of customers who came back, and reminders followed by a visit within 14 days (last 90 days). */
export async function returnStats(
  db: Db,
  now: Date = new Date(),
): Promise<{
  customers: number;
  returning: number;
  reminders90d: number;
  remindersFollowed: number;
}> {
  const since = new Date(now.getTime() - 90 * 86_400_000);
  const [visits] = await db.execute<{ customers: number; returning: number }>(sql`
    select
      (select count(*) from ${customers})::int as customers,
      (select count(*) from (
        select ${events.customerId} from ${events}
        where ${events.type} = 'stamp'
        group by ${events.customerId} having count(*) >= 2
      ) r)::int as returning
  `);
  const [reminders] = await db.execute<{ reminders90d: number; remindersFollowed: number }>(sql`
    select
      count(*)::int as "reminders90d",
      count(*) filter (where exists (
        select 1 from ${events} v
        where v.customer_id = r.customer_id and v.type = 'stamp'
          and v.created_at > r.created_at
          and v.created_at <= r.created_at + interval '14 days'
      ))::int as "remindersFollowed"
    from ${events} r
    where r.type = 'reminder_sent'
      and r.created_at >= ${since.toISOString()}::timestamptz
      and r.created_at <= ${now.toISOString()}::timestamptz
  `);
  return {
    customers: visits!.customers,
    returning: visits!.returning,
    reminders90d: reminders!.reminders90d,
    remindersFollowed: reminders!.remindersFollowed,
  };
}
