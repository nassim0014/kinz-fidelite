import bcrypt from 'bcryptjs';
import { and, eq, sql } from 'drizzle-orm';
import { jwtVerify, SignJWT } from 'jose';
import type { Db } from '@/db';
import { pinAttempts, staff } from '@/db/schema';
import { AppError } from './errors';

export interface Session {
  staffId: string;
  name: string;
  role: 'staff' | 'owner';
}

export const SESSION_COOKIE = 'kinz_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;
// Compared against when the name is unknown, so timing doesn't reveal which names exist.
const DUMMY_HASH = bcrypt.hashSync('000000', 10);

export const isValidPin = (pin: string): boolean => /^\d{6}$/.test(pin);
export const hashPin = (pin: string): Promise<string> => bcrypt.hash(pin, 10);

const keyOf = (secret: string) => new TextEncoder().encode(secret);

export async function createSessionToken(s: Session, secret: string): Promise<string> {
  return new SignJWT({ name: s.name, role: s.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.staffId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(keyOf(secret));
}

export async function readSessionToken(
  token: string | undefined,
  secret: string,
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, keyOf(secret), { algorithms: ['HS256'] });
    const { sub, name, role } = payload;
    if (typeof sub !== 'string' || typeof name !== 'string') return null;
    if (role !== 'staff' && role !== 'owner') return null;
    return { staffId: sub, name, role };
  } catch {
    return null;
  }
}

export async function login(
  db: Db,
  input: { name: string; pin: string; client?: string; now?: Date },
): Promise<Session> {
  const now = input.now ?? new Date();
  const name = input.name.trim().toLowerCase();
  // Lockout is per staff name AND device (see clientKeyFrom), capped to keep keys bounded.
  const key = `staff:${name.slice(0, 60)}@${(input.client ?? 'direct').slice(0, 64)}`;

  const [attempt] = await db.select().from(pinAttempts).where(eq(pinAttempts.key, key));
  if (attempt?.lockedUntil && attempt.lockedUntil > now) throw new AppError('LOCKED');

  const [member] = await db
    .select()
    .from(staff)
    .where(and(sql`lower(${staff.name}) = ${name}`, eq(staff.active, true)));
  const ok = await bcrypt.compare(input.pin, member?.pinHash ?? DUMMY_HASH);

  if (!member || !ok) {
    // Atomic increment: parallel guesses cannot all observe the same counter.
    const [row] = await db
      .insert(pinAttempts)
      .values({ key, failures: 1 })
      .onConflictDoUpdate({
        target: pinAttempts.key,
        set: { failures: sql`${pinAttempts.failures} + 1` },
      })
      .returning({ failures: pinAttempts.failures });
    const locked = (row?.failures ?? 0) >= MAX_FAILURES;
    if (locked) {
      await db
        .update(pinAttempts)
        .set({ failures: 0, lockedUntil: new Date(now.getTime() + LOCK_MS) })
        .where(eq(pinAttempts.key, key));
    }
    throw new AppError(locked ? 'LOCKED' : 'INVALID_CREDENTIALS');
  }

  await db.delete(pinAttempts).where(eq(pinAttempts.key, key));
  return { staffId: member.id, name: member.name, role: member.role };
}
