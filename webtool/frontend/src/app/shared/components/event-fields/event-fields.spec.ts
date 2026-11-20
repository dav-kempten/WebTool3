import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { EventFields, EventFieldsConfig } from './event-fields';

function eventForm() {
  return new FormGroup({
    title: new FormControl('Kurz'),
    name: new FormControl('Lang'),
    approximateId: new FormControl<number | null>(null),
    startTime: new FormControl<string | null>('08:00'),
    endTime: new FormControl<string | null>(null),
    startDate: new FormControl<Date | null>(new Date(2027, 2, 14)),
    endDate: new FormControl<Date | null>(null),
    rendezvous: new FormControl('Alpinzentrum Kempten, Parkplatz'),
    source: new FormControl('Birgsau'),
    location: new FormControl('Hütte'),
    lea: new FormControl(false),
    distal: new FormControl(true),
    publicTransport: new FormControl(false),
    shuttleService: new FormControl(false),
    reservationService: new FormControl(false),
    distance: new FormControl(0),
    link: new FormControl(''),
    map: new FormControl(''),
    description: new FormControl('Text'),
  });
}

@Component({
  imports: [ReactiveFormsModule, EventFields],
  template: `<avk-event-fields [form]="form" [config]="config()" />`,
})
class Host {
  readonly form = eventForm();
  readonly config = signal<EventFieldsConfig>({ locationLabel: 'Ort' });
}

function setup(config: EventFieldsConfig) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.config.set(config);
  fixture.detectChanges();
  const element: HTMLElement = fixture.nativeElement;
  const labels = () => Array.from(element.querySelectorAll('label')).map((l) => l.textContent?.trim());
  return { fixture, element, labels, form: fixture.componentInstance.form };
}

describe('EventFields', () => {
  it('shows only times, start date and places for a minimal config', () => {
    const { labels } = setup({ locationLabel: 'Ort' });
    expect(labels()).toEqual(['Startzeit', 'Endzeit', 'Startdatum', 'Treffpunkt', 'Ort']);
  });

  it('lays out a full tour in the agreed order', () => {
    const { labels } = setup({
      titles: { title: 't', name: 'n' },
      approximate: true,
      endDate: 'Enddatum',
      sourceLabel: 'Ausgangspunkt',
      locationLabel: 'Übernachtungsort',
      checkboxes: ['lea', 'distal', 'publicTransport', 'shuttleService'],
      distance: 'km',
      link: true,
      map: true,
      description: { rows: 3, hint: 'Sonderzeichen' },
    });
    expect(labels()).toEqual([
      'Kurztitel', 'Langtitel',
      'Tageszeit (ca.)', 'Startzeit', 'Endzeit',
      'Startdatum', 'Enddatum',
      'Treffpunkt', 'Ausgangspunkt', 'Übernachtungsort',
      'Low Emission Adventure', 'Gemeinschaftsanreise', 'Öffentliche Anreise', 'Alpin-Shuttle',
      'Gesamtfahrstrecke (km)', 'Tourenportal-Link', 'Kartenausschnitt-URL',
      'Beschreibung',
    ]);
  });

  it('binds the fields to the given form', () => {
    const { fixture, element, form } = setup({ locationLabel: 'Ort', sourceLabel: 'Kursort', checkboxes: ['distal'] });
    const source = element.querySelector<HTMLInputElement>('input[formcontrolname="source"]')!;
    expect(source.value).toBe('Birgsau');
    source.value = 'Klettergarten';
    source.dispatchEvent(new Event('input'));
    expect(form.value.source).toBe('Klettergarten');
    form.controls.location.setValue('Neue Hütte');
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('input[formcontrolname="location"]')!.value).toBe('Neue Hütte');
  });

  it('puts the homepage hint under each place with its homepage label', () => {
    const { element } = setup({
      sourceLabel: 'Kursort',
      locationLabel: 'Übernachtungsort',
      placeHint: (label) => `Homepage: ${label}`,
    });
    const hints = Array.from(element.querySelectorAll('small')).map((s) => s.textContent?.trim());
    expect(hints).toEqual(['Homepage: Treffpunkt', 'Homepage: Kursort', 'Homepage: Übernachtung']);
  });
});
