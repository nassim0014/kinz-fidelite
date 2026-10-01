import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { env } from '@/lib/env';
import { clientKeyFrom } from '@/server/client-key';
import { createSessionToken, login, SESSION_COOKIE, SESSION_TTL_SECONDS } from '@/server/auth';
import { jsonError } from '@/server/http';

const Body = z.object({ name: z.string().trim().min(1).max(60), pin: z.string().max(12) });

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const session = await login(getDb(), { ...body, client: clientKeyFrom(req.headers) });
    const res = NextResponse.json({ name: session.name, role: session.role });
    res.cookies.set(SESSION_COOKIE, await createSessionToken(session, env().SESSION_SECRET), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
