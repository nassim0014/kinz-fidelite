import { describe, expect, it } from 'vitest';
import { clientKeyFrom } from './client-key';

const h = (init: Record<string, string>) => new Headers(init);

describe('clientKeyFrom', () => {
  it('uses Vercel’s client IP header on Vercel', () => {
    expect(
      clientKeyFrom(h({ 'x-real-ip': '198.51.100.7', 'x-forwarded-for': '1.1.1.1' }), {
        VERCEL: '1',
      }),
    ).toBe('198.51.100.7');
  });
  it('uses the first X-Forwarded-For hop only behind a trusted proxy', () => {
    expect(
      clientKeyFrom(h({ 'x-forwarded-for': '192.168.1.20, 10.0.0.1' }), { TRUST_PROXY: '1' }),
    ).toBe('192.168.1.20');
  });
  it('ignores client-supplied headers when no trusted proxy is configured', () => {
    expect(clientKeyFrom(h({ 'x-forwarded-for': '6.6.6.6', 'x-real-ip': '6.6.6.6' }), {})).toBe(
      'direct',
    );
  });
  it('falls back to "unknown" when a trusted proxy sent nothing', () => {
    expect(clientKeyFrom(h({}), { VERCEL: '1' })).toBe('unknown');
  });
});
