import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { parseAmount } from '@/lib/amount';
import { AppError } from '@/server/errors';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';
import { stamp } from '@/server/stamping';

const Body = z.object({ customerId: z.string().uuid(), amount: z.string().max(20) });

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff(req);
    const body = Body.parse(await req.json());
    const amountTnd = parseAmount(body.amount);
    if (amountTnd === null) throw new AppError('INVALID_AMOUNT');
    const result = await stamp(getDb(), {
      customerId: body.customerId,
      amountTnd,
      staffId: session.staffId,
    });
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e);
  }
}
