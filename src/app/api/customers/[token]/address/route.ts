import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { setAddress } from '@/server/customers';
import { jsonError } from '@/server/http';

const Body = z.object({ address: z.string().max(300) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { address } = Body.parse(await req.json());
    await setAddress(getDb(), token, address);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}
