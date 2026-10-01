import { NextRequest } from 'next/server';
import { createSessionToken } from '@/server/auth';

export async function cookieFor(member: { id: string; name: string; role: 'staff' | 'owner' }) {
  const token = await createSessionToken(
    { staffId: member.id, name: member.name, role: member.role },
    process.env.SESSION_SECRET!,
  );
  return `kinz_session=${token}`;
}

export function req(url: string, init: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(new URL(url, 'http://localhost'), {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    headers: {
      'content-type': 'application/json',
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
  });
}
