import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { States } from '../../models/value';
import { guardReadyState, spansSeveralDays } from './ready-guard';

function setup(stored: States) {
  const form = new FormGroup({ stateId: new FormControl<number>(stored) });
  const store = { stateId: stored as number };
  // Mirrors the detail forms: every group change is written to the store.
  form.valueChanges.subscribe((value) => (store.stateId = value.stateId!));
  let allowed = false;
  let blocked = 0;
  guardReadyState(form.get('stateId')!, {
    current: () => store.stateId,
    allowed: () => allowed,
    onBlocked: () => blocked++,
    destroyRef: TestBed.inject(DestroyRef),
  });
  return { form, store, allow: (v: boolean) => (allowed = v), blocked: () => blocked };
}

describe('guardReadyState', () => {
  it('undoes "Fertig" picked in the dropdown and opens the checklist; the store never sees it', () => {
    const t = setup(States.WORKING);
    t.form.get('stateId')!.setValue(States.READY);
    expect(t.form.get('stateId')!.value).toBe(States.WORKING);
    expect(t.store.stateId).toBe(States.WORKING);
    expect(t.blocked()).toBe(1);
  });

  it('lets "Fertig" through once the checklist is confirmed', () => {
    const t = setup(States.WORKING);
    t.allow(true);
    t.form.get('stateId')!.setValue(States.READY);
    expect(t.store.stateId).toBe(States.READY);
    expect(t.blocked()).toBe(0);
  });

  it('leaves every other state change alone', () => {
    const t = setup(States.READY);
    t.form.get('stateId')!.setValue(States.WORKING);
    expect(t.store.stateId).toBe(States.WORKING);
    const staff = setup(States.ACCEPTED);
    staff.form.get('stateId')!.setValue(States.READY);
    expect(staff.store.stateId).toBe(States.READY);
    expect(t.blocked() + staff.blocked()).toBe(0);
  });
});

describe('spansSeveralDays', () => {
  it('is true only when the end date lies after the start date', () => {
    expect(spansSeveralDays({ startDate: '2026-11-07', endDate: '2026-11-08' })).toBe(true);
    expect(spansSeveralDays({ startDate: '2026-11-07', endDate: '2026-11-07' })).toBe(false);
    expect(spansSeveralDays({ startDate: '2026-11-07', endDate: null })).toBe(false);
    expect(spansSeveralDays(undefined)).toBe(false);
  });
});
