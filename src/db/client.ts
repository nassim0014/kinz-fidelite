import { env } from '@/lib/env';
import { makeDb, type Db } from './index';

const globalForDb = globalThis as unknown as { kinzDb?: Db };

/** One pool per server instance (survives dev hot reloads). */
export function getDb(): Db {
  globalForDb.kinzDb ??= makeDb(env().DATABASE_URL);
  return globalForDb.kinzDb;
}
