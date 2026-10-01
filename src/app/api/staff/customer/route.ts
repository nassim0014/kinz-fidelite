import { NextResponse, type NextRequest } from 'next/server';
import { getDb } from '@/db/client';
import { findCustomerByPhone, getCustomerByToken } from '@/server/customers';
import { AppError } from '@/server/errors';
import { jsonError } from '@/server/http';
import { getStaffView } from '@/server/perks';
import { requireStaff } from '@/server/session';

export async function GET(req: NextRequest) {
  try {
    await requireStaff(req);
    const db = getDb();
    const token = req.nextUrl.searchParams.get('token');
    const phone = req.nextUrl.searchParams.get('phone');
    const customer = token
      ? await getCustomerByToken(db, token)
      : phone
        ? await findCustomerByPhone(db, phone)
        : null;
    if (!customer) throw new AppError('NOT_FOUND');
    return NextResponse.json(await getStaffView(db, customer));
  } catch (e) {
    return jsonError(e);
  }
}
