import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgres://kinz:kinz@localhost:5433/kinz_dev',
  SESSION_SECRET: 'x'.repeat(32),
  APP_URL: 'http://localhost:3000/',
};

describe('parseEnv', () => {
  it('accepts a complete environment and strips the trailing slash of APP_URL', () => {
    expect(parseEnv(valid).APP_URL).toBe('http://localhost:3000');
  });
  it('rejects a short session secret', () => {
    expect(() => parseEnv({ ...valid, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });
  it('rejects a missing database url', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });
});
