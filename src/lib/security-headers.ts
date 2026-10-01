export interface Header {
  key: string;
  value: string;
}

/**
 * Response headers for every page. HSTS is left out of the store build (DISABLE_HSTS=1):
 * there, customers browse plain http on the shop Wi-Fi and must never be forced to https.
 */
export function securityHeaders(env: Record<string, string | undefined> = process.env): Header[] {
  const headers: Header[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Card URLs carry the customer's secret token: never leak them to other sites.
    { key: 'Referrer-Policy', value: 'no-referrer' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  ];
  if (env.DISABLE_HSTS !== '1') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains',
    });
  }
  return headers;
}
