import { cookies, headers } from 'next/headers';
import type { NextResponse } from 'next/server';
import { LOCALE_COOKIE, type Locale, localeFromRequest } from '@/lib/copy/locale';

/** Language of a visitor who has no card yet: their choice, else their phone's language. */
export async function visitorLocale(): Promise<Locale> {
  return localeFromRequest(
    (await cookies()).get(LOCALE_COOKIE)?.value,
    (await headers()).get('accept-language'),
  );
}

export function rememberLocale(res: NextResponse, locale: Locale): NextResponse {
  res.cookies.set(LOCALE_COOKIE, locale, { maxAge: 31_536_000, sameSite: 'lax', path: '/' });
  return res;
}
