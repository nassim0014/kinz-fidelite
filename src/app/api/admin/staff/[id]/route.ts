import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { updateStaff } from '@/server/staff';

const Body = z.object({ active: z.boolean().optional(), pin: z.string().max(12).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff(req, 'owner');
    const { id } = await params;
    const body = Body.parse(await req.json());
    await updateStaff(getDb(), {
      id: z.string().uuid().parse(id),
      actorId: session.staffId,
      ...body,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
