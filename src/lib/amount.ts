/** Parses a receipt total typed by staff: "85,500", "85.5", "1 250". Up to 3 decimals (millimes). */
export function parseAmount(input: string): number | null {
  const compact = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(compact)) return null;
  return Number(compact);
}
