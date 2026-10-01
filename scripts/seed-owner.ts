import { config } from 'dotenv';
import { makeDb } from '../src/db';
import { createStaff } from '../src/server/staff';

async function main() {
  config({ path: process.env.ENV_FILE ?? '.env.local' });
  const [name, pin] = process.argv.slice(2);
  if (!name || !pin) {
    console.error('Usage : npm run db:seed-owner -- "<Nom>" <PIN à 6 chiffres>');
    process.exit(1);
  }
  const db = makeDb(process.env.DATABASE_URL!, { max: 1 });
  try {
    const owner = await createStaff(db, { name, pin, role: 'owner' });
    console.log(`Compte propriétaire créé : ${owner.name}`);
  } finally {
    await db.$client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
