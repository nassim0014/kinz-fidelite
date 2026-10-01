import { describe, expect, it } from 'vitest';
import { GET as exportRoute } from '@/app/api/admin/export/route';
import { GET as listStaffRoute, POST as createStaffRoute } from '@/app/api/admin/staff/route';
import { PATCH as patchStaff } from '@/app/api/admin/staff/[id]/route';
import { exportCustomersCsv, listEvents, listFiguiers } from '@/server/admin';
import { stamp } from '@/server/stamping';
import { makeCustomer, makeStaff, testDb } from './helpers';
import { cookieFor, req } from './http';

describe('admin queries', () => {
  it('lists recent events with names and the Figuiers', async () => {
    const s = await makeStaff();
    const c = await makeCustomer({ firstName: 'Salma' });
    const leila = await makeCustomer({
      firstName: 'Leila',
      lifetimePepins: 600,
      address: 'Sousse',
    });
    await stamp(testDb, { customerId: c.id, amountTnd: 50, staffId: s.id });
    const [e] = await listEvents(testDb);
    expect(e).toMatchObject({ type: 'stamp', customerName: 'Salma', staffName: 'Amel' });
    expect((await listFiguiers(testDb)).map((f) => f.firstName)).toEqual(['Leila']);
    const csv = await exportCustomersCsv(testDb);
    expect(csv).toContain('prenom;telephone');
    expect(csv).toContain(`Leila;${leila.phone.slice(1)};`);
  });
});

describe('admin routes', () => {
  it('are reserved to owners (403 for staff)', async () => {
    const s = await makeStaff('Amel', 'staff');
    const res = await listStaffRoute(req('/api/admin/staff', { cookie: await cookieFor(s) }));
    expect(res.status).toBe(403);
  });

  it('create, deactivate and export as owner', async () => {
    const o = await makeStaff('Nassim', 'owner');
    const cookie = await cookieFor(o);
    const created = await createStaffRoute(
      req('/api/admin/staff', { body: { name: 'Sami', pin: '111111', role: 'staff' }, cookie }),
    );
    expect(created.status).toBe(201);
    const { id } = await created.json();
    const off = await patchStaff(
      req(`/api/admin/staff/${id}`, { method: 'PATCH', body: { active: false }, cookie }),
      { params: Promise.resolve({ id }) },
    );
    expect(off.status).toBe(200);
    const csv = await exportRoute(req('/api/admin/export?type=customers', { cookie }));
    expect(csv.headers.get('content-type')).toMatch(/text\/csv/);
    expect(csv.headers.get('content-disposition')).toMatch(/attachment; filename="kinz-customers-/);
  });
});
