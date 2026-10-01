import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/customers/[token]/version/route';
import { stamp } from '@/server/stamping';
import { makeCustomer, makeStaff } from './helpers';
import { testDb } from './helpers';
import { req } from './http';

const call = (token: string) =>
  GET(req(`/api/customers/${token}/version`), { params: Promise.resolve({ token }) });

describe('GET /api/customers/:token/version', () => {
  it('returns a version that changes when the card changes', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const before = await (await call(c.token)).json();
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id });
    const after = await (await call(c.token)).json();
    expect(typeof before.v).toBe('string');
    expect(after.v).not.toBe(before.v);
  });
  it('404s for an unknown card', async () => {
    expect((await call('AAAAAAAAAAAAAAAAAAAAAA')).status).toBe(404);
  });
});
