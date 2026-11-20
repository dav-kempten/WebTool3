import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { RENDEZVOUS_MAX_LENGTH, RendezvousInput, STANDARD_RENDEZVOUS } from './rendezvous-input';

@Component({
  imports: [ReactiveFormsModule, RendezvousInput],
  template: `<avk-rendezvous-input [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('Edelweißparkplatz');
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  const picker = fixture.debugElement.children[0].componentInstance as RendezvousInput;
  return { fixture, input, picker, control: fixture.componentInstance.control };
}

describe('RendezvousInput', () => {
  it('shows the stored text and limits input to the backend length', () => {
    const { input } = setup();
    expect(input.value).toBe('Edelweißparkplatz');
    expect(input.getAttribute('maxlength')).toBe(String(RENDEZVOUS_MAX_LENGTH));
  });

  it('writes free text back to the form', () => {
    const { input, control } = setup();
    input.value = 'Bahnhof Kempten';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe('Bahnhof Kempten');
    expect(control.dirty).toBe(true);
  });

  it('offers the standard meeting points, which fit the field', () => {
    const { fixture, input, picker, control } = setup();
    expect(picker.items.map((item) => item.label)).toEqual([...STANDARD_RENDEZVOUS]);
    picker.items[1].command!({});
    fixture.detectChanges();
    expect(control.value).toBe('Alpinzentrum Kempten, Parkplatz');
    expect(input.value).toBe('Alpinzentrum Kempten, Parkplatz');
    for (const text of STANDARD_RENDEZVOUS) {
      expect(text.length).toBeLessThanOrEqual(RENDEZVOUS_MAX_LENGTH);
    }
  });

  it('follows the disabled state of the control', () => {
    const { fixture, input, control } = setup();
    control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
  });
});
