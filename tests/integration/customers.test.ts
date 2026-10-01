import { describe, expect, it } from 'vitest';
import { AppError } from '@/server/errors';
import {
  createCustomer,
  findCustomerByPhone,
  getCustomerByToken,
  setAddress,
} from '@/server/customers';
import { makeCustomer, testDb } from './helpers';

describe('createCustomer', () => {
  it('creates a customer with a normalised phone and a 22-char token', async () => {
    const { token } = await createCustomer(testDb, { firstName: '  Salma ', phone: '22 123 456' });
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const c = await getCustomerByToken(testDb, token);
    expect(c).toMatchObject({
      firstName: 'Salma',
      phone: '+21622123456',
      cardStamps: 0,
      lifetimePepins: 0,
    });
  });

  it('refuses an invalid phone', async () => {
    await expect(createCustomer(testDb, { firstName: 'A', phone: '123' })).rejects.toMatchObject({
      code: 'INVALID_PHONE',
    });
  });

  it('refuses a phone that already has a card, without revealing that card', async () => {
    await createCustomer(testDb, { firstName: 'Salma', phone: '22123456' });
    const err = await createCustomer(testDb, {
      firstName: 'Intrus',
      phone: '+216 22 123 456',
    }).catch((e) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('PHONE_TAKEN');
    expect(JSON.stringify(err)).not.toMatch(/[A-Za-z0-9_-]{22}/);
  });
});

describe('lookups', () => {
  it('finds by phone in any accepted format and ignores malformed tokens', async () => {
    const c = await makeCustomer();
    expect((await findCustomerByPhone(testDb, c.phone.replace('+216', '')))?.id).toBe(c.id);
    expect(await findCustomerByPhone(testDb, 'garbage')).toBeNull();
    expect(await getCustomerByToken(testDb, "' OR 1=1 --")).toBeNull();
  });
});

describe('setAddress', () => {
  it('is reserved to level 34+', async () => {
    const c = await makeCustomer({ lifetimePepins: 560 });
    await expect(setAddress(testDb, c.token, '12 rue de Marseille, Tunis')).rejects.toMatchObject({
      code: 'PERK_LOCKED',
    });
  });
  it('stores a trimmed address for a Figuier and rejects nonsense', async () => {
    const c = await makeCustomer({ lifetimePepins: 561 });
    await expect(setAddress(testDb, c.token, 'ab')).rejects.toMatchObject({
      code: 'INVALID_ADDRESS',
    });
    await setAddress(testDb, c.token, '  12 rue de Marseille, Tunis  ');
    expect((await getCustomerByToken(testDb, c.token))?.address).toBe('12 rue de Marseille, Tunis');
  });
});
