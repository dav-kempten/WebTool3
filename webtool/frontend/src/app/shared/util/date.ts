/** Helpers to bridge ISO date strings (wire format) and JS Date (PrimeNG DatePicker). */

/** `2024-07-15` -> Date (local midnight), or null for empty input. */
export function fromIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) {
    return null;
  }
  return new Date(y, m - 1, d);
}

/** Date -> `2024-07-15`, or null for empty input. */
export function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : fromIsoDate(value);
  if (!date) {
    return null;
  }
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local midnight of the day after today, for `[minDate]` bindings that must exclude today. */
export function tomorrow(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

/**
 * Lower bound for a date picker that edits an *existing* date: normally
 * tomorrow, but never later than the value already stored. PrimeNG renders a
 * value below `minDate` as an empty field, so a stricter bound would silently
 * hide the dates of past events.
 */
export function relaxedMinDate(current: Date | null | undefined): Date {
  const floor = tomorrow();
  return current && current < floor ? current : floor;
}

/** `2024-07-15` -> `15.07.2024` for display. */
export function formatIsoDateDe(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value;
}

/**
 * Date column of the event lists. A single day keeps the full date
 * (`15.07.2024`); a period collapses into a range (`11.06. - 22.07.26`), where
 * the start drops its year because the end already carries it. Across a
 * year boundary both years are shown (`30.12.25 - 06.01.26`), otherwise the
 * range would read as if it were within one year.
 */
export function formatIsoDateRangeDe(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = startDate?.split('-');
  if (!start || start.length !== 3) {
    return '';
  }
  const end = endDate?.split('-');
  if (!end || end.length !== 3 || endDate === startDate) {
    return formatIsoDateDe(startDate);
  }
  const startYear = start[0] === end[0] ? '' : start[0].slice(-2);
  return `${start[2]}.${start[1]}.${startYear} - ${end[2]}.${end[1]}.${end[0].slice(-2)}`;
}
