import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { POST as createCustomerRoute } from '@/app/api/customers/route';
import { POST as cardLocale } from '@/app/api/customers/[token]/locale/route';
import { POST as visitorLocaleRoute } from '@/app/api/locale/route';
import { customers } from '@/db/schema';
import { makeCustomer, testDb } from './helpers';
import { req } from './http';

const localeOf = async (token: string) =>
  (await testDb.select().from(customers).where(eq(customers.token, token)))[0]?.locale;
const params = (token: string) => ({ params: Promise.resolve({ token }) });

describe('customer language', () => {
  it('keeps existing customers in French', async () => {
    const c = await makeCustomer();
    expect(c.locale).toBe('fr');
  });

  it('records the language chosen at sign-up', async () => {
    const res = await createCustomerRoute(
      req('/api/customers', { body: { firstName: 'Salma', phone: '22 000 111', locale: 'tn' } }),
    );
    expect(res.status).toBe(201);
    expect(await localeOf((await res.json()).token)).toBe('tn');
  });

  it('saves the language on the card and remembers it on the phone', async () => {
    const c = await makeCustomer();
    const res = await cardLocale(
      req(`/api/customers/${c.token}/locale`, { body: { locale: 'ar' } }),
      params(c.token),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('set-cookie')).toContain('kinz_lang=ar');
    expect(await localeOf(c.token)).toBe('ar');
  });

  it('rejects an unknown language and an unknown card', async () => {
    const c = await makeCustomer();
    const bad = await cardLocale(
      req(`/api/customers/${c.token}/locale`, { body: { locale: 'xx' } }),
      params(c.token),
    );
    expect(bad.status).toBe(400);
    const ghost = 'A'.repeat(22);
    const missing = await cardLocale(
      req(`/api/customers/${ghost}/locale`, { body: { locale: 'en' } }),
      params(ghost),
    );
    expect(missing.status).toBe(404);
  });

  it('remembers a visitor language before sign-up', async () => {
    const res = await visitorLocaleRoute(req('/api/locale', { body: { locale: 'en' } }));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain('kinz_lang=en');
  });
});
