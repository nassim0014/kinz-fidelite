/** Accepts 8-digit Tunisian numbers with optional +216 / 00216 / 216 prefix. */
export function normalizeTunisianPhone(input: string): string | null {
  const compact = input.replace(/[\s.\-()]/g, '');
  const match = compact.match(/^(?:\+216|00216|216)?([2-9]\d{7})$/);
  return match ? `+216${match[1]}` : null;
}
