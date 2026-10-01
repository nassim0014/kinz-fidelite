const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export const isCardToken = (value: string): boolean => TOKEN_RE.test(value);

/** Staff scanner reads either the full card URL (…/c/<token>) or a bare token. */
export function extractToken(scanned: string): string | null {
  const text = scanned.trim();
  if (isCardToken(text)) return text;
  const match = text.match(/\/c\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/);
  return match ? match[1]! : null;
}
