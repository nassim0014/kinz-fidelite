import { and, eq } from 'drizzle-orm';
import type { Db, DbOrTx } from '@/db';
import { customers, events, type Customer } from '@/db/schema';
import { businessDate } from '@/lib/dates';
import { levelFromPepins, type Perk, PERKS, perksUnlocked } from '@/lib/rules';
import { buildCardView, type StaffCustomerView } from '@/lib/views';
import { AppError } from './errors';

const isHandedOver = (p: Perk) => p.kind === 'once' || p.kind === 'yearly';

/** Perk levels already handed over: ever for "once", this Tunis year for "yearly". */
async function givenPerkLevels(db: DbOrTx, customerId: string, now: Date): Promise<Set<number>> {
  const year = businessDate(now).slice(0, 4);
  const rows = await db
    .select({ detail: events.detail, day: events.businessDate })
    .from(events)
    .where(and(eq(events.customerId, customerId), eq(events.type, 'perk_given')));
  const given = new Set<number>();
  for (const row of rows) {
    const perk = PERKS.find((p) => String(p.level) === row.detail);
    if (!perk) continue;
    if (perk.kind === 'once' || row.day.startsWith(year)) given.add(perk.level);
  }
  return given;
}

export async function givablePerks(
  db: DbOrTx,
  c: Customer,
  now: Date = new Date(),
): Promise<Perk[]> {
  const given = await givenPerkLevels(db, c.id, now);
  return perksUnlocked(levelFromPepins(c.lifetimePepins)).filter(
    (p) => isHandedOver(p) && !given.has(p.level),
  );
}

export async function givePerk(
  db: Db,
  input: { customerId: string; perkLevel: number; staffId: string; now?: Date },
): Promise<void> {
  const now = input.now ?? new Date();
  const perk = PERKS.find((p) => p.level === input.perkLevel);
  if (!perk || !isHandedOver(perk)) throw new AppError('PERK_NOT_GIVABLE');

  await db.transaction(async (tx) => {
    const [c] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .for('update');
    if (!c) throw new AppError('NOT_FOUND');
    if (levelFromPepins(c.lifetimePepins) < perk.level) throw new AppError('PERK_LOCKED');
    if ((await givenPerkLevels(tx, c.id, now)).has(perk.level)) {
      throw new AppError('PERK_ALREADY_GIVEN');
    }
    await tx.insert(events).values({
      customerId: c.id,
      type: 'perk_given',
      detail: String(perk.level),
      staffId: input.staffId,
      businessDate: businessDate(now),
    });
  });
}

export async function getStaffView(
  db: Db,
  c: Customer,
  now: Date = new Date(),
): Promise<StaffCustomerView> {
  const [stampedToday] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.customerId, c.id),
        eq(events.type, 'stamp'),
        eq(events.businessDate, businessDate(now)),
      ),
    )
    .limit(1);
  return {
    customerId: c.id,
    phone: c.phone,
    card: buildCardView(c),
    stampedToday: Boolean(stampedToday),
    givablePerks: await givablePerks(db, c, now),
  };
}
