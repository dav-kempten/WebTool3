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

/** `2024-07-15` -> `15.07.2024` for display. */
export function formatIsoDateDe(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value;
}
