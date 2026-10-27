import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { merge } from 'rxjs';

/*
 * An event starts either at an exact time ("Startzeit") or at an approximate
 * time of day ("Tageszeit (ca.)"); the event forms grey out the other field.
 * A chosen time of day always locks the start time. With both set (old data)
 * the time of day therefore stays editable, so the form never ends up with
 * both fields locked: clearing it frees the start time again.
 */

/** True once a time of day is chosen — locks the start time. */
export function usesApproximate(form: AbstractControl): boolean {
  return form.get('approximateId')?.value != null;
}

/** True while an exact start time is entered and no time of day is chosen — locks the time of day. */
export function hasStartTime(form: AbstractControl): boolean {
  return !!form.get('startTime')?.value && !usesApproximate(form);
}

/**
 * Keeps the two fields of an event form mutually locked. Done on the controls
 * rather than with a [disabled] binding: on a plain input with formControlName
 * that binding never reaches the element, and disabling the control also works
 * without a change-detection pass. A disabled control keeps its value; it is
 * only left out of the group's `value`, so read the form with getRawValue().
 *
 * Choosing a time of day clears an exact start time first; it would otherwise
 * stay saved behind the lock and win on the homepage. Stored values are left
 * alone when the form opens.
 */
export function lockStartTimeOrApproximate(form: AbstractControl, destroyRef: DestroyRef): void {
  const startTime = form.get('startTime');
  const approximate = form.get('approximateId');
  if (!startTime || !approximate) {
    return;
  }
  const apply = () => {
    setEnabled(startTime, !usesApproximate(form));
    setEnabled(approximate, !hasStartTime(form));
  };
  approximate.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((value) => {
    if (value != null && startTime.value) {
      startTime.setValue(null);
    }
  });
  merge(startTime.valueChanges, approximate.valueChanges)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(apply);
  apply();
}

function setEnabled(control: AbstractControl, enabled: boolean): void {
  if (enabled && control.disabled) {
    control.enable({ emitEvent: false });
  } else if (!enabled && control.enabled) {
    control.disable({ emitEvent: false });
  }
}
