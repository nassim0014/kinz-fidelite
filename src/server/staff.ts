import { eq, sql } from 'drizzle-orm';
import type { Db } from '@/db';
import { staff } from '@/db/schema';
import { hashPin, isValidPin } from './auth';
import { AppError, isUniqueViolation } from './errors';

export interface StaffRow {
  id: string;
  name: string;
  role: 'staff' | 'owner';
  active: boolean;
  createdAt: Date;
}

const columns = {
  id: staff.id,
  name: staff.name,
  role: staff.role,
  active: staff.active,
  createdAt: staff.createdAt,
};

export function listStaff(db: Db): Promise<StaffRow[]> {
  return db.select(columns).from(staff).orderBy(staff.createdAt);
}

export async function createStaff(
  db: Db,
  input: { name: string; pin: string; role: 'staff' | 'owner' },
): Promise<StaffRow> {
  const name = input.name.trim();
  if (!isValidPin(input.pin)) throw new AppError('INVALID_PIN');
  const [clash] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(sql`lower(${staff.name}) = ${name.toLowerCase()}`);
  if (clash) throw new AppError('NAME_TAKEN');
  try {
    const [row] = await db
      .insert(staff)
      .values({ name, role: input.role, pinHash: await hashPin(input.pin) })
      .returning(columns);
    return row!;
  } catch (e) {
    // Two simultaneous "Ajouter" clicks both pass the check above; the unique index decides.
    if (isUniqueViolation(e)) throw new AppError('NAME_TAKEN');
    throw e;
  }
}

export async function updateStaff(
  db: Db,
  input: { id: string; actorId: string; active?: boolean; pin?: string },
): Promise<void> {
  if (input.active === false && input.id === input.actorId) {
    throw new AppError('CANNOT_DEACTIVATE_SELF');
  }
  const patch: { active?: boolean; pinHash?: string } = {};
  if (input.active !== undefined) patch.active = input.active;
  if (input.pin !== undefined) {
    if (!isValidPin(input.pin)) throw new AppError('INVALID_PIN');
    patch.pinHash = await hashPin(input.pin);
  }
  const [exists] = await db.select({ id: staff.id }).from(staff).where(eq(staff.id, input.id));
  if (!exists) throw new AppError('NOT_FOUND');
  if (Object.keys(patch).length > 0) {
    await db.update(staff).set(patch).where(eq(staff.id, input.id));
  }
}
