import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { readSessionToken, SESSION_COOKIE, type Session } from './auth';
import { verifySession } from './session';

export async function getPageSession(role?: 'owner'): Promise<Session | null> {
  const store = await cookies();
  const session = await readSessionToken(store.get(SESSION_COOKIE)?.value, env().SESSION_SECRET);
  try {
    return await verifySession(session, role);
  } catch {
    return null;
  }
}
