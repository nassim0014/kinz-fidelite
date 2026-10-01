type Cell = string | number | null | undefined;

function cell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semicolon-separated with BOM so French Excel opens it directly. */
export function toCsv(rows: Record<string, Cell>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const lines = [headers.join(';'), ...rows.map((r) => headers.map((h) => cell(r[h])).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}
