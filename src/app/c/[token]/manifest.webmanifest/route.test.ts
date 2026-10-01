import { describe, expect, it } from 'vitest';
import { GET } from './route';

const call = (token: string) =>
  GET(new Request(`http://localhost/c/${token}/manifest.webmanifest`), {
    params: Promise.resolve({ token }),
  });

describe('GET /c/[token]/manifest.webmanifest', () => {
  it('returns a manifest whose start_url is the card page', async () => {
    const token = 'abcdefghijklmnopqrstuv';
    const res = await call(token);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/manifest+json');
    const body = await res.json();
    expect(body.start_url).toBe(`/c/${token}`);
    expect(body.scope).toBe('/');
    expect(body.name).toBe('KINZ Fidélité');
  });

  it('404s on a malformed token', async () => {
    expect((await call('nope')).status).toBe(404);
  });
});
