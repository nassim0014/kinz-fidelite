import { cardHint } from './card-hint';
import { getCopy, type Locale } from './copy';
import { businessDate, isBirthdayMonth } from './dates';
import { levelFromPepins } from './rules';

/** Why a customer is worth a WhatsApp nudge, most useful first. */
export type ReminderReason = 'reward_waiting' | 'one_stamp_away' | 'birthday_month' | 'dormant';

export interface ReminderInput {
  cardStamps: number;
  lifetimePepins: number;
  birthday: string | null;
  createdAt: Date;
  lastVisitAt: Date | null;
  lastReminderAt: Date | null;
}

export const REMINDER_LABEL: Record<ReminderReason, string> = {
  reward_waiting: 'Récompense à utiliser',
  one_stamp_away: 'À 1 tampon',
  birthday_month: 'Mois d’anniversaire',
  dormant: 'Pas venu depuis 45 jours',
};

const REWARD_WAITING_DAYS = 21;
const ONE_STAMP_AWAY_DAYS = 7;
const DORMANT_DAYS = 45;
const SILENCE_DAYS = 14;
const BIRTHDAY_PERK_LEVEL = 7;

const daysSince = (d: Date, now: Date) => Math.floor((now.getTime() - d.getTime()) / 86_400_000);

/** One birthday greeting per month, even though the 14-day silence would allow a second one. */
const remindedThisMonth = (at: Date | null, now: Date) =>
  at !== null && businessDate(at).slice(0, 7) === businessDate(now).slice(0, 7);

export function reminderReason(c: ReminderInput, now: Date = new Date()): ReminderReason | null {
  if (c.lastReminderAt && daysSince(c.lastReminderAt, now) < SILENCE_DAYS) return null;
  const away = daysSince(c.lastVisitAt ?? c.createdAt, now);
  const hint = cardHint(c.cardStamps);
  if (hint.available && away >= REWARD_WAITING_DAYS) return 'reward_waiting';
  if (hint.next?.missing === 1 && away >= ONE_STAMP_AWAY_DAYS) return 'one_stamp_away';
  if (
    levelFromPepins(c.lifetimePepins) >= BIRTHDAY_PERK_LEVEL &&
    isBirthdayMonth(c.birthday, now) &&
    !remindedThisMonth(c.lastReminderAt, now)
  ) {
    return 'birthday_month';
  }
  if (away >= DORMANT_DAYS) return 'dormant';
  return null;
}

export function reminderMessage(
  reason: ReminderReason,
  c: { firstName: string; cardStamps: number; cardUrl: string },
  locale: Locale = 'fr',
): string {
  const copy = getCopy(locale);
  const hint = cardHint(c.cardStamps);
  return copy.reminders[reason]({
    firstName: c.firstName,
    cardUrl: c.cardUrl,
    reward: hint.available ? copy.stops[hint.available.stamps] : undefined,
    next: hint.next ? copy.stops[hint.next.stop.stamps] : undefined,
  });
}
