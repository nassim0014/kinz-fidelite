import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { LOCALES } from '@/lib/copy/locale';
import { isValidBirthday } from '@/lib/dates';
import { createCustomer } from '@/server/customers';
import { jsonError } from '@/server/http';

const Body = z.object({
  firstName: z.string().trim().min(1).max(40),
  phone: z.string().max(30),
  birthday: z
    .string()
    .refine((v) => isValidBirthday(v))
    .optional(),
  locale: z.enum(LOCALES).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const result = await createCustomer(getDb(), body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return jsonError(e);
  }
}
