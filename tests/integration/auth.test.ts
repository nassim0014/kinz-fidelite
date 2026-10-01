import { describe, expect, it } from 'vitest';
import { createSessionToken, login, readSessionToken } from '@/server/auth';
import { createStaff, listStaff, updateStaff } from '@/server/staff';
import { testDb } from './helpers';

const SECRET = 'test-secret-test-secret-test-secret-123';
const T0 = new Date('2026-10-01T10:00:00Z');
const minutes = (m: number) => new Date(T0.getTime() + m * 60_000);

describe('staff accounts', () => {
  it('creates staff with a 6-digit PIN and refuses duplicates (case-insensitive)', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    expect(s).toMatchObject({ name: 'Amel', role: 'staff', active: true });
    await expect(
      createStaff(testDb, { name: 'amel', pin: '654321', role: 'staff' }),
    ).rejects.toMatchObject({ code: 'NAME_TAKEN' });
    await expect(
      createStaff(testDb, { name: 'Sami', pin: '1234', role: 'staff' }),
    ).rejects.toMatchObject({ code: 'INVALID_PIN' });
    expect((await listStaff(testDb)).map((r) => r.name)).toEqual(['Amel']);
  });

  it('never lets an owner deactivate themself', async () => {
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await expect(
      updateStaff(testDb, { id: o.id, actorId: o.id, active: false }),
    ).rejects.toMatchObject({ code: 'CANNOT_DEACTIVATE_SELF' });
  });
});

describe('login', () => {
  it('logs in with the right PIN, case-insensitive name', async () => {
    await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const session = await login(testDb, { name: ' amel ', pin: '123456', now: T0 });
    expect(session).toMatchObject({ name: 'Amel', role: 'staff' });
  });

  it('locks for 10 minutes after 5 failures, even for the right PIN', async () => {
    await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    for (let i = 0; i < 4; i++) {
      await expect(login(testDb, { name: 'Amel', pin: '000000', now: T0 })).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
      });
    }
    await expect(login(testDb, { name: 'Amel', pin: '000000', now: T0 })).rejects.toMatchObject({
      code: 'LOCKED',
    });
    await expect(
      login(testDb, { name: 'Amel', pin: '123456', now: minutes(9) }),
    ).rejects.toMatchObject({ code: 'LOCKED' });
    await expect(
      login(testDb, { name: 'Amel', pin: '123456', now: minutes(11) }),
    ).resolves.toMatchObject({ name: 'Amel' });
  });

  it('gives the same error for an unknown name and refuses deactivated staff', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await expect(login(testDb, { name: 'Personne', pin: '123456', now: T0 })).rejects.toMatchObject(
      { code: 'INVALID_CREDENTIALS' },
    );
    await updateStaff(testDb, { id: s.id, actorId: o.id, active: false });
    await expect(login(testDb, { name: 'Amel', pin: '123456', now: T0 })).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('accepts a new PIN after a reset', async () => {
    const s = await createStaff(testDb, { name: 'Amel', pin: '123456', role: 'staff' });
    const o = await createStaff(testDb, { name: 'Nassim', pin: '123456', role: 'owner' });
    await updateStaff(testDb, { id: s.id, actorId: o.id, pin: '999999' });
    await expect(login(testDb, { name: 'Amel', pin: '999999', now: T0 })).resolves.toMatchObject({
      name: 'Amel',
    });
  });
});

describe('session tokens', () => {
  it('round-trips a signed session and rejects tampering', async () => {
    const token = await createSessionToken({ staffId: 'abc', name: 'Amel', role: 'staff' }, SECRET);
    expect(await readSessionToken(token, SECRET)).toEqual({
      staffId: 'abc',
      name: 'Amel',
      role: 'staff',
    });
    expect(await readSessionToken(token, 'another-secret-another-secret-123456')).toBeNull();
    expect(await readSessionToken(`${token}x`, SECRET)).toBeNull();
    expect(await readSessionToken(undefined, SECRET)).toBeNull();
  });
});
