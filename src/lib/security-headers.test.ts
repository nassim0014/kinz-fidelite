import { expect, it } from 'vitest';
import { securityHeaders } from './security-headers';

const keys = (h: { key: string }[]) => h.map((x) => x.key);

it('sends HSTS by default (Vercel / real domain)', () => {
  expect(keys(securityHeaders({}))).toContain('Strict-Transport-Security');
});

it('omits HSTS in the store build, where customers use plain http on the Wi-Fi', () => {
  const h = securityHeaders({ DISABLE_HSTS: '1' });
  expect(keys(h)).not.toContain('Strict-Transport-Security');
  expect(keys(h)).toContain('Referrer-Policy');
});
