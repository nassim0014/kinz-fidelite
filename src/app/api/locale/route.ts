import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { LOCALES } from '@/lib/copy/locale';
import { jsonError } from '@/server/http';
import { rememberLocale } from '@/server/locale';

const Body = z.object({ locale: z.enum(LOCALES) });

export async function POST(req: NextRequest) {
  try {
    const { locale } = Body.parse(await req.json());
    return rememberLocale(NextResponse.json({ ok: true }), locale);
  } catch (e) {
    return jsonError(e);
  }
}
