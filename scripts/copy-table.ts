/** Prints every customer string side by side (FR | TN | EN | AR) for Nassim's review. */
import { getCopy, LOCALES } from '../src/lib/copy';

const SAMPLE = {
  firstName: 'Salma',
  cardUrl: 'https://fidelite.kinzoils.com/c/…',
  reward: '−20 % sur 1 produit',
  next: '−50 % sur 1 produit',
};

function flatten(v: unknown, path: string, out: Map<string, string[]>, i: number) {
  if (typeof v === 'function') {
    const fn = v as (...a: unknown[]) => unknown;
    const variants =
      fn.length === 1 && path.includes('reminders')
        ? [fn(SAMPLE)]
        : [fn(1, true, true), fn(2, false, false)];
    variants.forEach((r, k) =>
      flatten(r, variants.length > 1 ? `${path} (n=${k + 1})` : path, out, i),
    );
    return;
  }
  if (typeof v === 'string') {
    const row = out.get(path) ?? Array<string>(LOCALES.length).fill('');
    row[i] = v.replace(/\|/g, '\\|');
    out.set(path, row);
    return;
  }
  if (v && typeof v === 'object') {
    for (const [k, child] of Object.entries(v)) flatten(child, path ? `${path}.${k}` : k, out, i);
  }
}

const rows = new Map<string, string[]>();
LOCALES.forEach((l, i) => flatten(getCopy(l), '', rows, i));
console.log(`| clé | ${LOCALES.map((l) => l.toUpperCase()).join(' | ')} |`);
console.log(`|---|${LOCALES.map(() => '---').join('|')}|`);
for (const [key, cells] of rows) console.log(`| \`${key}\` | ${cells.join(' | ')} |`);
