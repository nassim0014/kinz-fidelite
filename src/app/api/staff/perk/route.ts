import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { givePerk } from '@/server/perks';
import { requireStaff } from '@/server/session';

const Body = z.object({ customerId: z.string().uuid(), perkLevel: z.number().int() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    await givePerk(getDb(), { ...body, staffId: session.staffId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
