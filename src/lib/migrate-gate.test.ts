import { describe, expect, it } from 'vitest';
import { shouldMigrate } from './migrate-gate';

describe('shouldMigrate', () => {
  it('runs outside Vercel (local, CI)', () => {
    expect(shouldMigrate({}).run).toBe(true);
  });
  it('runs on Vercel production', () => {
    expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'production' }).run).toBe(true);
  });
  it('skips on Vercel preview with a clear reason', () => {
    const r = shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'preview' });
    expect(r.run).toBe(false);
    expect(r.reason).toContain('Migrations ignorées');
    expect(r.reason).toContain('"preview"');
    expect(r.reason).toContain('ALLOW_PREVIEW_MIGRATIONS=1');
  });
  it('runs on Vercel preview when ALLOW_PREVIEW_MIGRATIONS=1', () => {
    expect(
      shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'preview', ALLOW_PREVIEW_MIGRATIONS: '1' }).run,
    ).toBe(true);
  });
  it('skips on Vercel development', () => {
    expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'development' }).run).toBe(false);
  });
});
