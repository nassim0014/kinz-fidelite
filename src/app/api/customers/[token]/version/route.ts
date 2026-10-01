import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/db/client';
import { getCustomerByToken } from '@/server/customers';
import { AppError } from '@/server/errors';
import { jsonError } from '@/server/http';

/** Tiny fingerprint of the card so open card pages only re-render when something changed. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const c = await getCustomerByToken(getDb(), token);
    if (!c) throw new AppError('NOT_FOUND');
    const v = `${c.cardStamps}.${c.lifetimePepins}.${c.address ? 1 : 0}`;
    return NextResponse.json({ v }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    return jsonError(e);
  }
}
