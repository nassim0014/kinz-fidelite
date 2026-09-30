import { config } from 'dotenv';
import { migrateDb } from '../support/db';

export default async function setup() {
  config({ path: '.env.test' });
  await migrateDb(process.env.DATABASE_URL!);
}
