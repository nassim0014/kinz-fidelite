import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const staffRole = pgEnum('staff_role', ['staff', 'owner']);
export const eventType = pgEnum('event_type', ['stamp', 'redeem', 'bonus', 'perk_given']);

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  role: staffRole('role').notNull().default('staff'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: text('token').notNull().unique(),
  firstName: text('first_name').notNull(),
  phone: text('phone').notNull().unique(),
  birthday: date('birthday', { mode: 'string' }),
  address: text('address'),
  cardStamps: integer('card_stamps').notNull().default(0),
  lifetimePepins: integer('lifetime_pepins').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    type: eventType('type').notNull(),
    amountTnd: numeric('amount_tnd', { precision: 10, scale: 3 }),
    stampsDelta: integer('stamps_delta').notNull().default(0),
    pepinsDelta: integer('pepins_delta').notNull().default(0),
    detail: text('detail'),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('events_one_stamp_per_day')
      .on(t.customerId, t.businessDate)
      .where(sql`type = 'stamp'`),
    index('events_customer_idx').on(t.customerId),
    index('events_created_idx').on(t.createdAt),
  ],
);

export const pinAttempts = pgTable('pin_attempts', {
  key: text('key').primaryKey(),
  failures: integer('failures').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
});

export type Customer = typeof customers.$inferSelect;
export type StaffMember = typeof staff.$inferSelect;
