import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { shouldMigrate } from '../src/lib/migrate-gate';

// Arbitrary constant: serialises concurrent builds migrating the same database.
const MIGRATION_LOCK_ID = 727_001_001;

async function main() {
  const decision = shouldMigrate(process.env);
  if (!decision.run) {
    console.log(decision.reason);
    return;
  }
  config({ path: process.env.ENV_FILE ?? '.env.local' });
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquant');
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await client`select pg_advisory_lock(${MIGRATION_LOCK_ID})`;
    try {
      await migrate(drizzle(client), { migrationsFolder: 'drizzle' });
      console.log('Migrations appliquées');
    } finally {
      await client`select pg_advisory_unlock(${MIGRATION_LOCK_ID})`;
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
