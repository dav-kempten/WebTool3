import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';

import { States } from '../../models/value';

/**
 * Lets an event go from "In Arbeit" to "Fertig" only through the checklist.
 * Picking "Fertig" in the state dropdown is undone at once and opens the
 * checklist instead — otherwise the two-minute auto-save would hand the event
 * in unchecked. The control emits before its form group does, so the store
 * never sees the blocked value. Confirming the checklist sets "Fertig" with
 * `allowed()` returning true.
 */
export function guardReadyState(
  stateControl: AbstractControl,
  options: {
    /** The stored state before this change. */
    current: () => number | undefined;
    allowed: () => boolean;
    onBlocked: () => void;
    destroyRef: DestroyRef;
  },
): void {
  stateControl.valueChanges.pipe(takeUntilDestroyed(options.destroyRef)).subscribe((value) => {
    if (value === States.READY && options.current() === States.WORKING && !options.allowed()) {
      stateControl.setValue(States.WORKING);
      options.onBlocked();
    }
  });
}

/** True when an event lasts several days: its end date lies after its start date. */
export function spansSeveralDays(event: { startDate: string; endDate: string | null } | undefined): boolean {
  return !!event?.endDate && event.endDate > event.startDate;
}
