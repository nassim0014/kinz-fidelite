import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { createStaff, listStaff } from '@/server/staff';

const Body = z.object({
  name: z.string().trim().min(1).max(60),
  pin: z.string().max(12),
  role: z.enum(['staff', 'owner']),
});

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    return NextResponse.json(await listStaff(getDb()));
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    const row = await createStaff(getDb(), Body.parse(await req.json()));
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
