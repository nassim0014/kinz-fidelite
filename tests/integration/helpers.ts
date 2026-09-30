import { eq } from 'drizzle-orm';
import { makeDb } from '@/db';
import { customers, type Customer } from '@/db/schema';
import { createCustomer, getCustomerByToken } from '@/server/customers';

export const testDb = makeDb(process.env.DATABASE_URL!, { max: 4 });

let phoneSeq = 0;

export async function makeCustomer(
  state: Partial<
    Pick<Customer, 'cardStamps' | 'lifetimePepins' | 'birthday' | 'address' | 'firstName'>
  > = {},
): Promise<Customer> {
  phoneSeq += 1;
  const { token } = await createCustomer(testDb, {
    firstName: state.firstName ?? 'Salma',
    phone: `22${String(phoneSeq).padStart(6, '0')}`,
  });
  if (Object.keys(state).length > 0) {
    await testDb.update(customers).set(state).where(eq(customers.token, token));
  }
  return (await getCustomerByToken(testDb, token))!;
}
