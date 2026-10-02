import { cardHint } from './card-hint';
import { isBirthdayMonth } from './dates';
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

export function reminderReason(c: ReminderInput, now: Date = new Date()): ReminderReason | null {
  if (c.lastReminderAt && daysSince(c.lastReminderAt, now) < SILENCE_DAYS) return null;
  const away = daysSince(c.lastVisitAt ?? c.createdAt, now);
  const hint = cardHint(c.cardStamps);
  if (hint.available && away >= REWARD_WAITING_DAYS) return 'reward_waiting';
  if (hint.next?.missing === 1 && away >= ONE_STAMP_AWAY_DAYS) return 'one_stamp_away';
  if (
    levelFromPepins(c.lifetimePepins) >= BIRTHDAY_PERK_LEVEL &&
    isBirthdayMonth(c.birthday, now)
  ) {
    return 'birthday_month';
  }
  if (away >= DORMANT_DAYS) return 'dormant';
  return null;
}

export function reminderMessage(
  reason: ReminderReason,
  c: { firstName: string; cardStamps: number; cardUrl: string },
): string {
  const hint = cardHint(c.cardStamps);
  switch (reason) {
    case 'reward_waiting':
      return `Bonjour ${c.firstName}, votre récompense KINZ vous attend : ${hint.available?.label}. Passez la récupérer en boutique. Votre carte : ${c.cardUrl}`;
    case 'one_stamp_away':
      return `Bonjour ${c.firstName}, plus qu’un tampon avant ${hint.next?.stop.label} sur votre carte KINZ. À bientôt en boutique ! ${c.cardUrl}`;
    case 'birthday_month':
      return `Joyeux mois d’anniversaire ${c.firstName} ! Profitez de −20 % chez KINZ tout ce mois-ci. Votre carte : ${c.cardUrl}`;
    case 'dormant':
      return `Bonjour ${c.firstName}, ça fait un moment ! Vos pépins vous attendent chez KINZ. Votre carte : ${c.cardUrl}`;
  }
}
