import { desc, eq, gte } from 'drizzle-orm';
import type { Db } from '@/db';
import { customers, events, staff } from '@/db/schema';
import { toCsv } from '@/lib/csv';
import { levelFromPepins, pepinsToReach } from '@/lib/rules';

export function listEvents(db: Db, limit = 200) {
  return db
    .select({
      id: events.id,
      createdAt: events.createdAt,
      type: events.type,
      amountTnd: events.amountTnd,
      stampsDelta: events.stampsDelta,
      pepinsDelta: events.pepinsDelta,
      detail: events.detail,
      customerName: customers.firstName,
      customerPhone: customers.phone,
      staffName: staff.name,
    })
    .from(events)
    .innerJoin(customers, eq(events.customerId, customers.id))
    .innerJoin(staff, eq(events.staffId, staff.id))
    .orderBy(desc(events.createdAt))
    .limit(limit);
}

export function listFiguiers(db: Db) {
  return db
    .select()
    .from(customers)
    .where(gte(customers.lifetimePepins, pepinsToReach(34)))
    .orderBy(desc(customers.lifetimePepins));
}

// Phones exported without "+" so spreadsheets don't read them as formulas.
const phoneForCsv = (p: string) => p.replace(/^\+/, '');

export async function exportCustomersCsv(db: Db): Promise<string> {
  const rows = await db.select().from(customers).orderBy(customers.createdAt);
  return toCsv(
    rows.map((c) => ({
      prenom: c.firstName,
      telephone: phoneForCsv(c.phone),
      anniversaire: c.birthday,
      adresse: c.address,
      tampons: c.cardStamps,
      pepins: c.lifetimePepins,
      niveau: levelFromPepins(c.lifetimePepins),
      inscrit_le: c.createdAt.toISOString(),
    })),
  );
}

export async function exportEventsCsv(db: Db): Promise<string> {
  const rows = await listEvents(db, 1_000_000);
  return toCsv(
    rows.map((e) => ({
      date: e.createdAt.toISOString(),
      type: e.type,
      client: e.customerName,
      telephone: phoneForCsv(e.customerPhone),
      montant_tnd: e.amountTnd,
      tampons: e.stampsDelta,
      pepins: e.pepinsDelta,
      detail: e.detail,
      equipe: e.staffName,
    })),
  );
}
