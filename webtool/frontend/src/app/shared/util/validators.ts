import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Matches 24h `HH:MM`, e.g. `09:05` or `23:59`. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * For an `endDate` control that sits in a group next to a `startDate`: the end
 * must not precede the start. Empty values pass — the end date is optional and
 * stays blank for single-day events.
 *
 * Placed on the control rather than the group so Angular marks the end-date
 * field itself `ng-invalid`, which is what drives the red border.
 */
export function endNotBeforeStartValidator(startKey = 'startDate'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const end = control.value as Date | null;
    const start = control.parent?.get(startKey)?.value as Date | null;
    if (!end || !start) {
      return null;
    }
    return end < start ? { endBeforeStart: true } : null;
  };
}

/** Validates optional `HH:MM` time strings; empty values pass (field is optional). */
export function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }
    return TIME_PATTERN.test(value) ? null : { timeFormat: true };
  };
}
