import { expect, it } from 'vitest';
import { extractToken, isCardToken } from './token';

const token = 'AbCdEfGhIjKlMnOpQrSt_-';

it('recognises a 22-character base64url token', () => {
  expect(isCardToken(token)).toBe(true);
  expect(isCardToken('short')).toBe(false);
  expect(isCardToken(`${token}x`)).toBe(false);
});

it('extracts the token from a scanned card URL or a raw token', () => {
  expect(extractToken(`https://fidelite.kinzoils.com/c/${token}`)).toBe(token);
  expect(extractToken(`http://localhost:3000/c/${token}?x=1`)).toBe(token);
  expect(extractToken(token)).toBe(token);
  expect(extractToken('https://example.com/other')).toBeNull();
  expect(extractToken('')).toBeNull();
});
