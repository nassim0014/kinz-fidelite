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
