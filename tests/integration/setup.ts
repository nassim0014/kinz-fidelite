import { afterAll, beforeEach } from 'vitest';
import { resetDb } from '../support/db';
import { testDb } from './helpers';

beforeEach(async () => {
  await resetDb(testDb);
});

afterAll(async () => {
  await testDb.$client.end();
});
