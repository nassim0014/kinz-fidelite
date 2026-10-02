import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { recordReminder } from '@/server/reminders';
import { requireStaff } from '@/server/session';

const Body = z.object({
  customerId: z.string().uuid(),
  reason: z.enum(['reward_waiting', 'one_stamp_away', 'birthday_month', 'dormant']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req, 'owner');
    const body = Body.parse(await req.json());
    const { recorded } = await recordReminder(getDb(), { ...body, staffId: session.staffId });
    return NextResponse.json({ ok: true, recorded });
  } catch (e) {
    return jsonError(e);
  }
}
