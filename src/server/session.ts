import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db/client';
import { staff } from '@/db/schema';
import { env } from '@/lib/env';
import { readSessionToken, SESSION_COOKIE, type Session } from './auth';
import { AppError } from './errors';

/** Re-checks the database so deactivation and role changes apply immediately. */
export async function verifySession(session: Session | null, role?: 'owner'): Promise<Session> {
  if (!session) throw new AppError('UNAUTHENTICATED');
  const [member] = await getDb()
    .select({ name: staff.name, role: staff.role, active: staff.active })
    .from(staff)
    .where(eq(staff.id, session.staffId));
  if (!member?.active) throw new AppError('UNAUTHENTICATED');
  if (role === 'owner' && member.role !== 'owner') throw new AppError('FORBIDDEN');
  return { staffId: session.staffId, name: member.name, role: member.role };
}

export async function requireStaff(req: NextRequest, role?: 'owner'): Promise<Session> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return verifySession(await readSessionToken(token, env().SESSION_SECRET), role);
}
