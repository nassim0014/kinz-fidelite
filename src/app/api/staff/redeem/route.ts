import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { redeem } from '@/server/stamping';

const Body = z.object({ customerId: z.string().uuid(), stop: z.number().int() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    return NextResponse.json(await redeem(getDb(), { ...body, staffId: session.staffId }));
  } catch (e) {
    return jsonError(e);
  }
}
