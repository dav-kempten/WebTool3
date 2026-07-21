import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Matches 24h `HH:MM`, e.g. `09:05` or `23:59`. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

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
