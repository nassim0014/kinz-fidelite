import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { staff } from '@/db/schema';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as createCustomer } from '@/app/api/customers/route';
import { POST as setAddress } from '@/app/api/customers/[token]/address/route';
import { GET as lookup } from '@/app/api/staff/customer/route';
import { POST as perk } from '@/app/api/staff/perk/route';
import { POST as redeem } from '@/app/api/staff/redeem/route';
import { POST as stampRoute } from '@/app/api/staff/stamp/route';
import { makeCustomer, makeStaff, testDb } from './helpers';
import { cookieFor, req } from './http';

describe('POST /api/customers', () => {
  it('creates a card (201) and refuses the same phone without leaking the token (409)', async () => {
    const first = await createCustomer(
      req('/api/customers', {
        body: { firstName: 'Salma', phone: '22 123 456', birthday: '1990-10-01' },
      }),
    );
    expect(first.status).toBe(201);
    expect((await first.json()).token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const second = await createCustomer(
      req('/api/customers', { body: { firstName: 'X', phone: '22123456' } }),
    );
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body).toEqual({ error: expect.stringContaining('déjà une carte'), code: 'PHONE_TAKEN' });
  });

  it('rejects an impossible birthday and an empty first name (400)', async () => {
    const bad = await createCustomer(
      req('/api/customers', {
        body: { firstName: 'Salma', phone: '22123457', birthday: '2026-02-31' },
      }),
    );
    expect(bad.status).toBe(400);
    const empty = await createCustomer(
      req('/api/customers', { body: { firstName: '  ', phone: '22123458' } }),
    );
    expect(empty.status).toBe(400);
  });
});

describe('staff routes', () => {
  it('require a session (401)', async () => {
    const c = await makeCustomer();
    const res = await stampRoute(
      req('/api/staff/stamp', { body: { customerId: c.id, amount: '85' } }),
    );
    expect(res.status).toBe(401);
  });

  it('stamp with a French decimal amount, then refuse the second stamp (409)', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    const ok = await stampRoute(
      req('/api/staff/stamp', { body: { customerId: c.id, amount: '85,500' }, cookie }),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ stampsAdded: 1, pepinsAdded: 2 });
    const again = await stampRoute(
      req('/api/staff/stamp', { body: { customerId: c.id, amount: '85' }, cookie }),
    );
    expect(again.status).toBe(409);
    expect((await again.json()).error).toBe("Déjà tamponné aujourd'hui");
  });

  it('reject garbage and absurd amounts (400)', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    for (const amount of ['abc', '8550']) {
      const res = await stampRoute(
        req('/api/staff/stamp', { body: { customerId: c.id, amount }, cookie }),
      );
      expect(res.status).toBe(400);
    }
  });

  it('look a customer up by phone or token, 404 otherwise', async () => {
    const s = await makeStaff();
    const c = await makeCustomer();
    const cookie = await cookieFor(s);
    const spaced = `${c.phone.slice(4, 6)} ${c.phone.slice(6, 9)} ${c.phone.slice(9)}`; // "22 000 001" style
    const byPhone = await lookup(
      req(`/api/staff/customer?phone=${encodeURIComponent(spaced)}`, { cookie }),
    );
    expect(byPhone.status).toBe(200);
    expect((await byPhone.json()).customerId).toBe(c.id);
    const byToken = await lookup(req(`/api/staff/customer?token=${c.token}`, { cookie }));
    expect((await byToken.json()).card.firstName).toBe('Salma');
    const missing = await lookup(req('/api/staff/customer?phone=99999999', { cookie }));
    expect(missing.status).toBe(404);
  });

  it('redeem and give perks', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ cardStamps: 3, lifetimePepins: 1 });
    const cookie = await cookieFor(s);
    const r = await redeem(
      req('/api/staff/redeem', { body: { customerId: c.id, stop: 3 }, cookie }),
    );
    expect(await r.json()).toMatchObject({ stop: 3, cardStamps: 0 });
    const p = await perk(
      req('/api/staff/perk', { body: { customerId: c.id, perkLevel: 2 }, cookie }),
    );
    expect(p.status).toBe(200);
  });

  it('locks out a deactivated staff member immediately', async () => {
    const s = await makeStaff();
    const cookie = await cookieFor(s);
    await testDb.update(staff).set({ active: false }).where(eq(staff.id, s.id));
    const c = await makeCustomer();
    const res = await lookup(req(`/api/staff/customer?token=${c.token}`, { cookie }));
    expect(res.status).toBe(401);
  });
});

describe('auth + address routes', () => {
  it('sets an httpOnly strict session cookie on login', async () => {
    await makeStaff('Amel', 'staff', '123456');
    const res = await login(req('/api/auth/login', { body: { name: 'Amel', pin: '123456' } }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toMatch(/kinz_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=strict/i);
    const bad = await login(req('/api/auth/login', { body: { name: 'Amel', pin: '000000' } }));
    expect(bad.status).toBe(401);
  });

  it('saves the address of a Figuier', async () => {
    const c = await makeCustomer({ lifetimePepins: 561 });
    const res = await setAddress(
      req(`/api/customers/${c.token}/address`, { body: { address: '12 rue de Marseille, Tunis' } }),
      { params: Promise.resolve({ token: c.token }) },
    );
    expect(res.status).toBe(200);
  });
});
