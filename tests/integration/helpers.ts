import { makeDb } from '@/db';

export const testDb = makeDb(process.env.DATABASE_URL!, { max: 4 });
