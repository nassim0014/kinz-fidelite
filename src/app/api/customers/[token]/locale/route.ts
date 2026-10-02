import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { LOCALES } from '@/lib/copy/locale';
import { setLocale } from '@/server/customers';
import { jsonError } from '@/server/http';
import { rememberLocale } from '@/server/locale';

const Body = z.object({ locale: z.enum(LOCALES) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { locale } = Body.parse(await req.json());
    await setLocale(getDb(), token, locale);
    return rememberLocale(NextResponse.json({ ok: true }), locale);
  } catch (e) {
    return jsonError(e);
  }
}
