import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { makeDb } from '../../src/db';
import { staff } from '../../src/db/schema';
import { migrateDb, resetDb } from '../support/db';

export default async function globalSetup() {
  config({ path: '.env.test' });
  const url = process.env.DATABASE_URL!;
  await migrateDb(url);
  const db = makeDb(url, { max: 1 });
  try {
    await resetDb(db);
    await db
      .insert(staff)
      .values({ name: 'E2E', role: 'owner', pinHash: await bcrypt.hash('123456', 10) });
  } finally {
    await db.$client.end();
  }
}
