const TZ = 'Africa/Tunis';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar day in Tunis as YYYY-MM-DD. */
export function businessDate(now: Date = new Date()): string {
  return dayFormatter.format(now);
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

export function isBirthday(birthday: string | null, now: Date = new Date()): boolean {
  if (!birthday) return false;
  const [y, m, d] = businessDate(now).split('-').map(Number);
  const [, bm, bd] = birthday.split('-').map(Number);
  if (bm === m && bd === d) return true;
  return bm === 2 && bd === 29 && !isLeap(y!) && m === 2 && d === 28;
}

export function isBirthdayMonth(birthday: string | null, now: Date = new Date()): boolean {
  if (!birthday) return false;
  return birthday.slice(5, 7) === businessDate(now).slice(5, 7);
}

/** Formats digits as dd/mm/yyyy while typing, so a numeric keypad without "/" is enough. */
export function formatDateTyping(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
}

/** YYYY-MM-DD (from the native calendar) to dd/mm/yyyy. */
export function isoToDayMonthYear(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Reads a date typed as dd/mm/yyyy (also with - or .) into YYYY-MM-DD, or null if impossible. */
export function parseDayMonthYear(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

export function isValidBirthday(value: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return value >= '1900-01-01' && value <= businessDate(now);
}

const dateTimeFormatter = new Intl.DateTimeFormat('fr-TN', {
  timeZone: TZ,
  dateStyle: 'short',
  timeStyle: 'short',
});

export const formatDateTime = (d: Date): string => dateTimeFormatter.format(d);
