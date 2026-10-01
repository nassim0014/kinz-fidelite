import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, ERROR_STATUS } from './errors';

export function jsonError(e: unknown): NextResponse {
  if (e instanceof AppError) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: ERROR_STATUS[e.code] });
  }
  if (e instanceof ZodError || e instanceof SyntaxError) {
    return NextResponse.json({ error: 'Données invalides', code: 'BAD_REQUEST' }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL' }, { status: 500 });
}
