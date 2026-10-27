import { DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { hasStartTime, lockStartTimeOrApproximate, usesApproximate } from './event-time';

function eventForm(startTime: string | null, approximateId: number | null): FormGroup {
  return new FormGroup({
    startTime: new FormControl(startTime),
    approximateId: new FormControl(approximateId),
  });
}

function locked(startTime: string | null, approximateId: number | null): FormGroup {
  const form = eventForm(startTime, approximateId);
  const destroyRef = TestBed.inject(Injector).get(DestroyRef);
  runInInjectionContext(TestBed.inject(Injector), () => lockStartTimeOrApproximate(form, destroyRef));
  return form;
}

describe('event-time', () => {
  it('leaves both fields open while neither is set', () => {
    const form = eventForm('', null);
    expect(hasStartTime(form)).toBe(false);
    expect(usesApproximate(form)).toBe(false);
  });

  it('locks the time of day once a start time is entered', () => {
    const form = eventForm('08:00', null);
    expect(hasStartTime(form)).toBe(true);
    expect(usesApproximate(form)).toBe(false);
  });

  it('locks the start time while a time of day is chosen', () => {
    const form = eventForm(null, 3);
    expect(hasStartTime(form)).toBe(false);
    expect(usesApproximate(form)).toBe(true);
  });

  it('locks the start time but keeps the time of day editable when old data has both set', () => {
    const form = eventForm('08:00', 3);
    expect(usesApproximate(form)).toBe(true);
    expect(hasStartTime(form)).toBe(false);
  });

  describe('lockStartTimeOrApproximate', () => {
    it('disables the start time as soon as a time of day is chosen, and frees it again', () => {
      const form = locked('', null);
      expect(form.get('startTime')!.disabled).toBe(false);

      form.get('approximateId')!.setValue(3);
      expect(form.get('startTime')!.disabled).toBe(true);
      expect(form.get('approximateId')!.disabled).toBe(false);

      form.get('approximateId')!.setValue(null);
      expect(form.get('startTime')!.disabled).toBe(false);
    });

    it('disables the time of day while a start time is entered', () => {
      const form = locked('', null);
      form.get('startTime')!.setValue('08:00');
      expect(form.get('approximateId')!.disabled).toBe(true);
      form.get('startTime')!.setValue('');
      expect(form.get('approximateId')!.disabled).toBe(false);
    });

    it('clears an entered start time when a time of day is chosen', () => {
      const form = locked('', null);
      form.get('startTime')!.setValue('08:00');
      // What the tour form hands to its store on every change.
      const seen: Array<string | null> = [];
      form.valueChanges.subscribe(() => seen.push(form.getRawValue().startTime));

      form.get('approximateId')!.setValue(3);
      expect(form.get('startTime')!.value).toBeNull();
      expect(form.get('startTime')!.disabled).toBe(true);
      expect(seen.at(-1)).toBeNull();
    });

    it('applies to stored values right away and never locks both', () => {
      const form = locked('08:00', 3);
      expect(form.get('startTime')!.disabled).toBe(true);
      expect(form.get('approximateId')!.disabled).toBe(false);
      // Opening the form changes nothing: the stored start time stays and a
      // disabled control keeps its value for getRawValue().
      expect(form.getRawValue().startTime).toBe('08:00');
    });
  });
});
