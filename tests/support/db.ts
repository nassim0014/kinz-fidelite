import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Db } from '../../src/db';

export async function migrateDb(url: string): Promise<void> {
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
  } finally {
    await client.end();
  }
}

export async function resetDb(db: Db): Promise<void> {
  await db.execute(sql`TRUNCATE events, customers, staff, pin_attempts RESTART IDENTITY CASCADE`);
}
