import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { businessDate } from '@/lib/dates';
import { exportCustomersCsv, exportEventsCsv } from '@/server/admin';
import { jsonError } from '@/server/http';
import { requireStaff } from '@/server/session';

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req, 'owner');
    const type = z.enum(['customers', 'events']).parse(req.nextUrl.searchParams.get('type'));
    const csv =
      type === 'customers' ? await exportCustomersCsv(getDb()) : await exportEventsCsv(getDb());
    return new NextResponse(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="kinz-${type}-${businessDate()}.csv"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}
