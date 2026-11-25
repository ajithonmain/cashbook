/** Local-time date helpers for the calendar picker. Days are passed around as local midnight in ms. */

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface Month {
  year: number;
  /** 0 to 11. */
  month: number;
}

export function monthOf(ts: number): Month {
  const d = new Date(ts);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function addMonths({ year, month }: Month, delta: number): Month {
  return monthOf(new Date(year, month + delta, 1).getTime());
}

/** Six Sunday-first weeks, so the grid keeps its height from month to month. Null cells are blank. */
export function monthGrid({ year, month }: Month): (number | null)[] {
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, i) => {
    const day = i - lead + 1;
    return day >= 1 && day <= days ? day : null;
  });
}

/** The same day of the month in another year; 29 February falls back to the 28th. */
export function withYear(ts: number, year: number): number {
  const d = new Date(ts);
  const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
  return new Date(year, d.getMonth(), Math.min(d.getDate(), lastDay)).getTime();
}

/** "HH:mm", the value format of a time input. */
export function toTimeValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Combines a day with a time input value. Null when the time is blank or malformed. */
export function combineDayAndTime(day: number, time: string): number | null {
  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (!match) return null;
  const d = new Date(day);
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d.getTime();
}
