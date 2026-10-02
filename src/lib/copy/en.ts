// À relire par Nassim avant mise en ligne.
import type { Copy, ReminderArgs } from './fr';
import { plural } from './plural';

const stamps = (n: number) => plural('en', n, { one: 'stamp', other: 'stamps' });
const seeds = (n: number) => plural('en', n, { one: 'seed', other: 'seeds' });

export const en = {
  meta: { join: 'Join', card: 'My card' },
  switcher: 'Language',

  join: {
    heading: 'Your loyalty card, on your phone',
    promises: [
      'A stamp on every visit, from 40 TND spent',
      'Rewards at levels 2, 3, 5, 7, 11, 13… can you guess what comes next?',
    ],
    journey: '50 levels, and seeds that multiply along the way:',
    firstName: 'First name',
    phone: 'Phone',
    birthday: 'Birthday',
    optional: '(optional)',
    birthdayHint: 'It unlocks gifts in your birthday month. Your details stay with KINZ.',
    birthdayPlaceholder: 'dd/mm/yyyy',
    pickDate: 'Pick from the calendar',
    submit: 'Create my card',
    submitting: 'Creating your card…',
  },

  strip: {
    label: 'The stages of the journey',
    caption: (stages: string) => `From seed to golden fig tree: ${stages}.`,
    stageAt: (name: string, level: number) => `${name} at level ${level}`,
    short: {
      1: 'Seed',
      5: 'Sprout',
      8: 'Pad',
      13: 'Flower',
      21: 'Fig',
      34: 'Fig Tree',
      50: 'Legend',
    },
  },

  card: {
    hello: (firstName: string) => `Hello ${firstName}`,
    label: 'My KINZ card',
    stampsSr: ' stamps',
    qrLabel: 'Your card QR code',
    present: 'Show this code at the counter after spending at least 40 TND.',
    stampsLabel: 'Stamps',
    stamp: (n: number, got: boolean, reward: boolean) =>
      `Stamp ${n}${got ? ', collected' : ''}${reward ? ', reward' : ''}`,
    available: '{reward} ready to use at the counter.',
    full: 'Card full. Use your reward on your next visit.',
    next: (n: number) => `${n} more ${stamps(n)} for {reward}.`,
    orContinue: (n: number) => `Or keep going: ${n} more ${stamps(n)} for {reward}.`,
    allRewards: 'All card rewards',
    finePrint:
      'Using a reward resets the card. Single products only (no packs, trios, duos, collections or gift boxes). Free product worth up to 49 TND.',
    homeScreen: 'Add this page to your home screen to open your card in one tap.',
  },

  level: {
    level: (n: number) => `Level ${n}`,
    golden: ' ✦ golden level',
    boost: (x: number) => `Seeds ×${x}`,
    progressLabel: 'Progress to the next level',
    progress: (total: number, missing: number, next: number) =>
      `${total} ${seeds(total)} in total. ${missing} more ${seeds(missing)} before level ${next}.`,
    max: (total: number) => `${total} seeds in total. Top level reached: you are a Legend.`,
  },

  perksList: {
    heading: 'My perks',
    none: 'Your first perk, a welcome sample, comes at the next level.',
    levelShort: (n: number) => `Lv. ${n}`,
    levelLong: (n: number) => `Level ${n}`,
    nextAt: (n: number) => `At level ${n}: `,
  },

  how: {
    heading: 'How does it work?',
    items: [
      {
        term: 'Stamps',
        text: '1 stamp from 40 TND spent, 2 from 120 TND, 3 from 300 TND. One stamped visit per day.',
      },
      {
        term: 'Rewards',
        text: 'On the card, at 3, 5, 7, 11 and 13 stamps. Use one right away, or wait for the next, more generous one. More await you as you level up.',
      },
      {
        term: 'Seeds',
        text: 'Every 40 TND spent earns you 1 seed (pépin). Seeds never expire and raise your level: moving up costs as many seeds as your current level.',
      },
      {
        term: 'Multipliers',
        text: 'At levels 13, 21 and 34, your seeds are multiplied by 2, then 3, then 5.',
      },
    ],
  },

  birthday: {
    month: 'Happy birthday month! −20% on your KINZ purchases until the end of the month.',
    day: 'Happy birthday! Today your stamps are doubled, and −20% on your purchases.',
  },

  address: {
    heading: 'You are a Fig Tree',
    intro: 'Where should we deliver your early-release new products?',
    label: 'Delivery address',
    save: 'Save the address',
    saving: 'Saving…',
  },

  notFound: {
    heading: 'Card not found',
    text: 'This link does not match any card. Ask at the counter to send yours again by WhatsApp or SMS.',
    create: 'Create a card',
  },

  errors: {
    INVALID_PHONE: 'Invalid phone number (8 Tunisian digits)',
    PHONE_TAKEN: 'This number already has a card. Ask at the counter to send it again.',
    INVALID_ADDRESS: 'Invalid address',
    NOT_FOUND: 'Customer not found',
    BAD_REQUEST: 'Invalid details',
    NETWORK: 'Cannot connect. Check your network and try again.',
    INVALID_BIRTHDAY: 'Invalid date (dd/mm/yyyy)',
    UNKNOWN: 'Something went wrong',
  },

  titles: {
    1: 'Seed',
    5: 'Sprout',
    8: 'Pad',
    13: 'Flower',
    21: 'Fig',
    34: 'Fig Tree',
    50: 'Legend of the Golden Fig Tree',
  },

  stops: {
    3: '−20% on 1 product',
    5: '−50% on 1 product',
    7: '−50% on 2 products',
    11: '1 free product (≤ 49 TND) + 11 seeds',
    13: '1 free product (≤ 49 TND) + −50% on a 2nd + 13 seeds',
  },

  perks: {
    2: 'Welcome sample',
    3: 'A free sample',
    5: 'Free 10 ml prickly pear seed oil',
    7: '−20% during your birthday month',
    11: 'Free gift wrapping',
    13: 'Seeds ×2, you become a Flower',
    17: 'Your card restarts at 1 stamp',
    19: 'Double stamps on your birthday',
    21: 'Seeds ×3, you become a Fig',
    23: 'Your card restarts at 2 stamps',
    29: 'Free delivery on kinzoils.com',
    31: 'Vote for the next product',
    34: 'Every new product delivered free before its release',
    37: 'A gift card for someone close to you',
    41: 'A free gift box every year',
    43: 'Workshop visit and a meeting with the founders',
    47: 'Permanent −10%',
    50: 'Your name on the Wall of Legends + a co-created limited edition',
  } as Record<number, string>,

  reminders: {
    reward_waiting: (a: ReminderArgs) =>
      `Hello ${a.firstName}, your KINZ reward is waiting: ${a.reward}. Come and collect it in store. Your card: ${a.cardUrl}`,
    one_stamp_away: (a: ReminderArgs) =>
      `Hello ${a.firstName}, just one stamp before ${a.next} on your KINZ card. See you soon in store! ${a.cardUrl}`,
    birthday_month: (a: ReminderArgs) =>
      `Happy birthday month ${a.firstName}! Enjoy −20% at KINZ all month long. Your card: ${a.cardUrl}`,
    dormant: (a: ReminderArgs) =>
      `Hello ${a.firstName}, it has been a while! Your seeds are waiting for you at KINZ. Your card: ${a.cardUrl}`,
  },
  resend: (cardUrl: string) => `Your KINZ loyalty card: ${cardUrl}`,
} satisfies Copy;
