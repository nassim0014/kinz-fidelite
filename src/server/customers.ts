import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Db, DbOrTx } from '@/db';
import { customers, type Customer } from '@/db/schema';
import { normalizeTunisianPhone } from '@/lib/phone';
import { levelFromPepins } from '@/lib/rules';
import { isCardToken } from '@/lib/token';
import { AppError, isUniqueViolation } from './errors';

export const newCardToken = (): string => randomBytes(16).toString('base64url');

export async function createCustomer(
  db: Db,
  input: { firstName: string; phone: string; birthday?: string | null },
): Promise<{ token: string }> {
  const phone = normalizeTunisianPhone(input.phone);
  if (!phone) throw new AppError('INVALID_PHONE');
  const token = newCardToken();
  try {
    await db.insert(customers).values({
      token,
      firstName: input.firstName.trim(),
      phone,
      birthday: input.birthday ?? null,
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError('PHONE_TAKEN');
    throw e;
  }
  return { token };
}

export async function getCustomerByToken(db: DbOrTx, token: string): Promise<Customer | null> {
  if (!isCardToken(token)) return null;
  const [row] = await db.select().from(customers).where(eq(customers.token, token));
  return row ?? null;
}

export async function findCustomerByPhone(db: Db, input: string): Promise<Customer | null> {
  const phone = normalizeTunisianPhone(input);
  if (!phone) return null;
  const [row] = await db.select().from(customers).where(eq(customers.phone, phone));
  return row ?? null;
}

export async function setAddress(db: Db, token: string, address: string): Promise<void> {
  const customer = await getCustomerByToken(db, token);
  if (!customer) throw new AppError('NOT_FOUND');
  if (levelFromPepins(customer.lifetimePepins) < 34) throw new AppError('PERK_LOCKED');
  const clean = address.trim();
  if (clean.length < 5 || clean.length > 300) throw new AppError('INVALID_ADDRESS');
  await db.update(customers).set({ address: clean }).where(eq(customers.id, customer.id));
}
