import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { ClaimService } from '../../../core/services/claim.service';
import { ClaimDefaults, ClaimInput, ClaimResult } from '../../../models/claim';
import { ClaimDialog } from './claim-dialog';

const DEFAULTS: ClaimDefaults = {
  kind: 'course',
  reference: 'GKS-701',
  title: 'Grundkurs Skitour',
  date: '14. März 2027',
  place: 'Oberstdorf',
  begin: '14.3.2027, 19.00 Uhr',
  end: '22.3.2027',
  leaders: 2,
  trainers: [
    { id: 7, name: 'Anna Alpin', level: 4, phone: '0170 1', memberId: '008-1', qualification: 'TB Skitour' },
    { id: 8, name: 'Hans Helfer', level: 2, phone: '0170 2', memberId: '008-2', qualification: 'JL' },
  ],
  trainerId: 7,
  name: 'Anna Alpin',
  phone: '0170 1',
  memberId: '008-1',
  qualification: 'TB Skitour',
  level: 4,
  days: [
    { date: '2027-03-14', hours: '2.50', kind: 'day', estimated: false },
    { date: '2027-03-21', hours: '8', kind: 'day', estimated: true },
  ],
  nights: [{ receipt: null }],
  carKm: 120,
  shuttle: false,
  participants: 6,
  invoiceDate: '2027-04-01',
  rates: {
    tour: { short: '25', long: '40' },
    course: { '2': ['9', '30', '55'], '4': ['13', '50', '85'] },
    levels: { '2': 'II (KB, FGL, WL, JL)', '4': 'IV (TB, BGF)' },
    preliminary: '10',
    nightFlat: '25',
    nightMax: '50',
    kmCar: '0.20',
    kmBike: '0.15',
    kmPassenger: '0.07',
    leitfaden: 'Leitfaden',
  },
};

const RESULT: ClaimResult = {
  dayAmounts: ['32.50', '85.00'],
  nightAmounts: ['25.00'],
  compensation: [],
  travel: [],
  expenses: [],
  subtotals: { compensation: '142.50', travel: '24.00', expenses: '0.00' },
  total: '166.50',
};

function setup(office = false) {
  const previews: ClaimInput[] = [];
  const downloads: ClaimInput[] = [];
  TestBed.configureTestingModule({
    providers: [
      MessageService,
      { provide: AuthService, useValue: { isOfficeOrAbove: signal(office) } },
      {
        provide: ClaimService,
        useValue: {
          defaults: () => of(structuredClone(DEFAULTS)),
          preview: (_kind: string, _id: number, input: ClaimInput) => {
            previews.push(input);
            return of(RESULT);
          },
          download: (_kind: string, _id: number, input: ClaimInput, done?: () => void) => {
            downloads.push(input);
            done?.();
          },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(ClaimDialog);
  fixture.componentRef.setInput('kind', 'instructions');
  fixture.componentRef.setInput('eventId', 5);
  fixture.componentRef.setInput('visible', true);
  fixture.detectChanges();
  return { fixture, dialog: fixture.componentInstance, previews, downloads };
}

// Mounting the dialog with its PrimeNG parts can take longer than the default
// 5 s under the load of the full suite; it used to time out now and then.
describe('ClaimDialog', { timeout: 20_000 }, () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('loads the defaults when opened and previews them', () => {
    const { fixture, dialog, previews } = setup();
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    const claim = dialog.claim()!;
    expect(claim.days.map((d) => d.hours)).toEqual([2.5, 8]);
    expect(claim).toMatchObject({ carKm: 120, passengerKm: 0, travelTo: 'Oberstdorf', phone: '0170 1' });
    expect(dialog.hasEstimatedDays()).toBe(true);
    expect(previews).toHaveLength(1);
    expect(previews[0].days[1]).not.toHaveProperty('estimated');
    expect(dialog.dayAmount(0)).toBe('32,50 €');
    expect(dialog.result()?.total).toBe('166.50');
  });

  it('sends corrections and drops the estimate once hours are touched', () => {
    const { fixture, dialog, previews } = setup();
    vi.advanceTimersByTime(400);
    dialog.setDay(1, { hours: 6.5 });
    dialog.patch({ carKm: 95, passengerKm: 40 });
    // toObservable() hängt an einem Effekt; der läuft erst mit der Change Detection.
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    expect(dialog.hasEstimatedDays()).toBe(false);
    expect(previews.at(-1)).toMatchObject({ carKm: 95, passengerKm: 40 });
    expect(previews.at(-1)?.days[1].hours).toBe(6.5);
  });

  it('adds and removes days, nights and expenses', () => {
    const { dialog } = setup();
    dialog.addDay();
    dialog.addNight();
    dialog.setNight(1, 42);
    dialog.addExpense();
    dialog.setExpense(0, { label: 'Liftkarte', amount: 38 });
    dialog.removeDay(0);
    dialog.removeNight(0);
    const claim = dialog.claim()!;
    expect(claim.days.map((d) => d.date)).toEqual(['2027-03-21', '2027-03-21']);
    expect(claim.nights).toEqual([{ receipt: 42 }]);
    expect(claim.expenses).toEqual([{ label: 'Liftkarte', amount: 38 }]);
  });

  it('lets only the office choose another trainer, taking over their data', () => {
    expect(setup(false).dialog.canChooseTrainer()).toBe(false);
    TestBed.resetTestingModule();
    const { dialog } = setup(true);
    expect(dialog.canChooseTrainer()).toBe(true);
    dialog.chooseTrainer(8);
    expect(dialog.claim()).toMatchObject({
      trainerId: 8, name: 'Hans Helfer', level: 2, phone: '0170 2', memberId: '008-2', qualification: 'JL',
    });
  });

  it('checks the IBAN, tidies a valid one and blocks the PDF for an invalid one', () => {
    const { dialog, downloads, previews, fixture } = setup();
    dialog.patch({ iban: 'DE02 1203 0000 0000 2020 52' });
    expect(dialog.ibanInvalid()).toBe(true);
    dialog.download();
    expect(downloads).toHaveLength(0);
    // Die Vorschau rechnet trotzdem, nur ohne die ungültige IBAN.
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    expect(previews.at(-1)?.iban).toBe('');

    dialog.patch({ iban: 'de02120300000000202051' });
    dialog.tidyIban();
    expect(dialog.claim()?.iban).toBe('DE02 1203 0000 0000 2020 51');
    dialog.download();
    expect(downloads).toHaveLength(1);
    expect(downloads[0].days.every((d) => !('estimated' in d))).toBe(true);
    expect(dialog.downloading()).toBe(false);
  });
});
