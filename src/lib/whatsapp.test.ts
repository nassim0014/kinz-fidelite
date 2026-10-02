import { expect, it } from 'vitest';
import { smsLink, waLink } from './whatsapp';

it('keeps only digits of the phone and encodes the whole text', () => {
  expect(waLink('+216 22 123 456', "Bonjour Leïla, c'est KINZ : https://x.tn/c/abc")).toBe(
    "https://wa.me/21622123456?text=Bonjour%20Le%C3%AFla%2C%20c'est%20KINZ%20%3A%20https%3A%2F%2Fx.tn%2Fc%2Fabc",
  );
});

it('builds an sms link with the raw phone', () => {
  expect(smsLink('+21622123456', 'a b')).toBe('sms:+21622123456?body=a%20b');
});
