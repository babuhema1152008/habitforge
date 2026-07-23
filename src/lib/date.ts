import type { DayOfWeek } from '@/types';

export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(date: string, amount: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + amount);
  return toISODate(d);
}

export function dayOfWeek(date: string): DayOfWeek {
  return new Date(`${date}T00:00:00`).getDay() as DayOfWeek;
}

export function formatFriendly(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Returns an array of ISO dates for a calendar month grid, padded to full weeks. */
export function getMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = firstDay.getDay();
  const grid: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) grid.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(toISODate(new Date(year, month, day)));
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

/** Last N days (including today), oldest first. */
export function lastNDays(n: number, from: string = todayISO()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(from, -i));
  return out;
}

export function isSameOrBefore(a: string, b: string): boolean {
  return a <= b;
}
