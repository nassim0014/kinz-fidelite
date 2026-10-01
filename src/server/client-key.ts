/**
 * Identifies the device behind a login attempt so the PIN lockout is per device:
 * an outsider who knows a staff name can only lock their own device, not the staff member.
 * Forwarding headers are only trusted behind a proxy that sets them (Vercel, or the store's
 * reverse proxy with TRUST_PROXY=1); otherwise they could be forged to dodge the lockout.
 */
export function clientKeyFrom(
  headers: Headers,
  env: Record<string, string | undefined> = process.env,
): string {
  const firstForwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (env.VERCEL) return headers.get('x-real-ip')?.trim() || firstForwarded || 'unknown';
  if (env.TRUST_PROXY === '1') return firstForwarded || 'unknown';
  return 'direct';
}
