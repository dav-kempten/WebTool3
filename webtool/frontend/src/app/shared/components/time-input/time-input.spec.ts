import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { timeFormatValidator } from '../../util/validators';
import { TimeInput, normalizeTime } from './time-input';

@Component({
  imports: [ReactiveFormsModule, TimeInput],
  template: `<avk-time-input [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl<string | null>('09:30', timeFormatValidator());
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  const picker = fixture.debugElement.children[0].componentInstance as TimeInput;
  return { fixture, input, picker, control: fixture.componentInstance.control };
}

function type(input: HTMLInputElement, text: string) {
  input.value = text;
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
}

describe('normalizeTime', () => {
  it.each([
    ['9', '09:00'],
    ['09', '09:00'],
    ['930', '09:30'],
    ['0930', '09:30'],
    ['9.30', '09:30'],
    ['9:30', '09:30'],
    ['18 15', '18:15'],
    ['  7:05 ', '07:05'],
    ['', ''],
  ])('reads %j as %j', (text, expected) => {
    expect(normalizeTime(text)).toBe(expected);
  });

  it.each(['25', '9:75', 'abends', '12:3'])('leaves %j for the validator', (text) => {
    expect(normalizeTime(text)).toBe(text.trim());
  });
});

describe('TimeInput', () => {
  it('shows the stored time', () => {
    const { input } = setup();
    expect(input.value).toBe('09:30');
  });

  it('accepts typed times and tidies them up on leaving the field', () => {
    const { fixture, input, control } = setup();
    type(input, '1745');
    fixture.detectChanges();
    expect(control.value).toBe('17:45');
    expect(input.value).toBe('17:45');
    expect(control.valid).toBe(true);
  });

  it('leaves unreadable input to the format validator', () => {
    const { input, control } = setup();
    type(input, 'abends');
    expect(control.value).toBe('abends');
    expect(control.hasError('timeFormat')).toBe(true);
  });

  it('takes the time chosen in the picker', () => {
    const { fixture, input, picker, control } = setup();
    picker.onPick(new Date(2026, 0, 1, 6, 5));
    fixture.detectChanges();
    expect(control.value).toBe('06:05');
    expect(input.value).toBe('06:05');
  });

  it('opens the picker on the stored time, or 08:00 when empty', () => {
    const { picker, control } = setup();
    expect(picker.pickerDate().getHours()).toBe(9);
    expect(picker.pickerDate().getMinutes()).toBe(30);
    control.setValue(null);
    expect(picker.pickerDate().getHours()).toBe(8);
  });

  it('follows the disabled state of the control', () => {
    const { fixture, input, control } = setup();
    control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
