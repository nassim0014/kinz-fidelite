import { describe, expect, it } from 'vitest';
import { type ReminderInput, reminderMessage, reminderReason } from './reminders';

const now = new Date('2026-10-02T10:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const base: ReminderInput = {
  cardStamps: 0,
  lifetimePepins: 0,
  birthday: null,
  createdAt: daysAgo(100),
  lastVisitAt: daysAgo(1),
  lastReminderAt: null,
};
const reason = (over: Partial<ReminderInput>) => reminderReason({ ...base, ...over }, now);

describe('reminderReason', () => {
  it('leaves a recent customer alone', () => {
    expect(reason({})).toBeNull();
  });

  it('flags a reward left waiting for 21 days', () => {
    expect(reason({ cardStamps: 3, lastVisitAt: daysAgo(21) })).toBe('reward_waiting');
    expect(reason({ cardStamps: 3, lastVisitAt: daysAgo(20) })).toBeNull();
  });

  it('flags a customer one stamp from a reward after a week', () => {
    expect(reason({ cardStamps: 4, lastVisitAt: daysAgo(7) })).toBe('one_stamp_away');
    expect(reason({ cardStamps: 4, lastVisitAt: daysAgo(6) })).toBeNull();
  });

  it('flags the birthday month from level 7 only', () => {
    expect(reason({ birthday: '1990-10-20', lifetimePepins: 21 })).toBe('birthday_month');
    expect(reason({ birthday: '1990-10-20', lifetimePepins: 15 })).toBeNull();
  });

  it('flags a customer away for 45 days', () => {
    expect(reason({ lastVisitAt: daysAgo(45) })).toBe('dormant');
  });

  it('counts the sign-up date when the customer never came back', () => {
    expect(reason({ lastVisitAt: null, createdAt: daysAgo(45) })).toBe('dormant');
    expect(reason({ lastVisitAt: null, createdAt: daysAgo(10) })).toBeNull();
  });

  it('keeps the most useful reason first', () => {
    expect(reason({ cardStamps: 4, lastVisitAt: daysAgo(45) })).toBe('reward_waiting');
  });

  it('stays silent for 14 days after a reminder', () => {
    const due = { cardStamps: 3, lastVisitAt: daysAgo(30) };
    expect(reason({ ...due, lastReminderAt: daysAgo(13) })).toBeNull();
    expect(reason({ ...due, lastReminderAt: daysAgo(14) })).toBe('reward_waiting');
  });
});

describe('reminderMessage', () => {
  it('names the customer, the reward and the card link', () => {
    const text = reminderMessage('reward_waiting', {
      firstName: 'Salma',
      cardStamps: 3,
      cardUrl: 'https://f.tn/c/x',
    });
    expect(text).toContain('Salma');
    expect(text).toContain('−20 % sur 1 produit');
    expect(text).toContain('https://f.tn/c/x');
    expect(text).not.toContain('—');
  });

  it('names the next reward for a customer one stamp away', () => {
    const text = reminderMessage('one_stamp_away', {
      firstName: 'Amira',
      cardStamps: 4,
      cardUrl: 'https://f.tn/c/y',
    });
    expect(text).toContain('−50 % sur 1 produit');
  });
});
