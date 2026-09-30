import { and, eq } from 'drizzle-orm';
import type { Db } from '@/db';
import { customers, events } from '@/db/schema';
import { businessDate, isBirthday } from '@/lib/dates';
import {
  addStamps,
  CARD_MAX,
  CARD_STOPS,
  levelFromPepins,
  MAX_AMOUNT_TND,
  MIN_AMOUNT_TND,
  pepinsFor,
  resetValue,
  stampsForVisit,
} from '@/lib/rules';
import type { RedeemResult, StampResult } from '@/lib/views';
import { AppError, isUniqueViolation } from './errors';

export async function stamp(
  db: Db,
  input: { customerId: string; amountTnd: number; staffId: string; now?: Date },
): Promise<StampResult> {
  const now = input.now ?? new Date();
  const amount = input.amountTnd;
  if (!Number.isFinite(amount)) throw new AppError('INVALID_AMOUNT');
  if (amount < MIN_AMOUNT_TND) throw new AppError('AMOUNT_TOO_LOW');
  if (amount > MAX_AMOUNT_TND) throw new AppError('AMOUNT_TOO_HIGH');
  const day = businessDate(now);

  try {
    return await db.transaction(async (tx) => {
      // Row lock serialises concurrent scans of the same customer.
      const [c] = await tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .for('update');
      if (!c) throw new AppError('NOT_FOUND');

      const [already] = await tx
        .select({ id: events.id })
        .from(events)
        .where(
          and(eq(events.customerId, c.id), eq(events.type, 'stamp'), eq(events.businessDate, day)),
        )
        .limit(1);
      if (already) throw new AppError('ALREADY_STAMPED');

      const levelBefore = levelFromPepins(c.lifetimePepins);
      const cardStamps = addStamps(
        c.cardStamps,
        stampsForVisit(amount, levelBefore, isBirthday(c.birthday, now)),
      );
      const pepinsAdded = pepinsFor(amount, levelBefore);
      const lifetimePepins = c.lifetimePepins + pepinsAdded;

      await tx.insert(events).values({
        customerId: c.id,
        type: 'stamp',
        amountTnd: amount.toFixed(3),
        stampsDelta: cardStamps - c.cardStamps,
        pepinsDelta: pepinsAdded,
        staffId: input.staffId,
        businessDate: day,
      });
      await tx.update(customers).set({ cardStamps, lifetimePepins }).where(eq(customers.id, c.id));

      return {
        stampsAdded: cardStamps - c.cardStamps,
        pepinsAdded,
        cardStamps,
        lifetimePepins,
        levelBefore,
        levelAfter: levelFromPepins(lifetimePepins),
        cardFull: cardStamps === CARD_MAX,
      };
    });
  } catch (e) {
    // Last line of defence: the partial unique index.
    if (isUniqueViolation(e)) throw new AppError('ALREADY_STAMPED');
    throw e;
  }
}

export async function redeem(
  db: Db,
  input: { customerId: string; stop: number; staffId: string; now?: Date },
): Promise<RedeemResult> {
  const now = input.now ?? new Date();
  const stop = CARD_STOPS.find((s) => s.stamps === input.stop);
  if (!stop) throw new AppError('STOP_NOT_REACHED');
  const day = businessDate(now);

  return db.transaction(async (tx) => {
    const [c] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, input.customerId))
      .for('update');
    if (!c) throw new AppError('NOT_FOUND');
    if (c.cardStamps < stop.stamps) throw new AppError('STOP_NOT_REACHED');

    const lifetimePepins = c.lifetimePepins + stop.bonusPepins;
    const levelAfter = levelFromPepins(lifetimePepins);
    const cardStamps = resetValue(levelAfter);

    await tx.insert(events).values({
      customerId: c.id,
      type: 'redeem',
      stampsDelta: cardStamps - c.cardStamps,
      detail: `${stop.stamps} : ${stop.label}`,
      staffId: input.staffId,
      businessDate: day,
    });
    if (stop.bonusPepins > 0) {
      await tx.insert(events).values({
        customerId: c.id,
        type: 'bonus',
        pepinsDelta: stop.bonusPepins,
        detail: `Bonus palier ${stop.stamps}`,
        staffId: input.staffId,
        businessDate: day,
      });
    }
    await tx.update(customers).set({ cardStamps, lifetimePepins }).where(eq(customers.id, c.id));

    return {
      stop: stop.stamps,
      label: stop.label,
      bonusPepins: stop.bonusPepins,
      cardStamps,
      lifetimePepins,
      levelAfter,
    };
  });
}
