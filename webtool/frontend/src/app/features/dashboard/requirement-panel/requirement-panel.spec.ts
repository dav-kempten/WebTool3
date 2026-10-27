import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RequirementPanel } from './requirement-panel';
import { RequirementsStore } from '../../../core/stores/requirements.store';
import { RequirementService } from '../../../core/services/requirement.service';
import { RequirementEntry, RequirementOverview } from '../../../models/requirement';

function entry(partial: Partial<RequirementEntry>): RequirementEntry {
  return {
    id: 1,
    categoryId: 1,
    code: 'SKT',
    name: 'Skitour',
    minimum: 0,
    maximum: 0,
    actual: 0,
    ...partial,
  };
}

function overview(entries: RequirementEntry[], unplanned: RequirementEntry[] = []) {
  const sum = (key: 'minimum' | 'maximum' | 'actual') =>
    entries.reduce((total, row) => total + row[key], 0);
  const group = {
    kind: 'tour' as const,
    label: 'Touren',
    minimum: sum('minimum'),
    maximum: sum('maximum'),
    actual: sum('actual'),
    entries,
    unplanned,
  };
  return {
    season: '2027',
    periodStart: '2026-12-01',
    periodEnd: '2027-11-30',
    sections: [
      {
        part: 'winter' as const,
        label: 'Winter 2026/27',
        minimum: group.minimum,
        maximum: group.maximum,
        actual: group.actual,
        groups: [group],
      },
    ],
  } satisfies RequirementOverview;
}

/** The first group of the first section — what most of these tests look at. */
function group(data: RequirementOverview) {
  return panel(data).sections()[0].groups[0];
}

function panel(data: RequirementOverview) {
  TestBed.configureTestingModule({
    providers: [{ provide: RequirementService, useValue: { getOverview: () => of(data) } }],
  });
  TestBed.inject(RequirementsStore).load();
  return TestBed.createComponent(RequirementPanel).componentInstance;
}

describe('RequirementPanel', () => {
  afterEach(() => TestBed.inject(RequirementsStore).reset());

  it('keeps a span as its two bounds and scales the bar to the upper one', () => {
    const [row] = group(overview([entry({ minimum: 10, maximum: 12, actual: 6 })])).rows;

    expect(row.target).toBe('10–12');
    expect(row.fill).toBe(50); // 6 von 12
    expect(row.tick).toBe(83); // die 10 auf einer Skala bis 12
    expect(row.note).toBe('noch 4');
  });

  it('shows an exact target without a tick', () => {
    const [row] = group(overview([entry({ minimum: 4, maximum: 4, actual: 1 })])).rows;

    expect(row.target).toBe('4');
    expect(row.tick).toBeNull();
    expect(row.fill).toBe(25);
  });

  it('separates nothing entered from partly entered from met', () => {
    const { rows } = group(
      overview([
        entry({ code: 'A', minimum: 4, maximum: 4, actual: 0 }),
        entry({ code: 'B', minimum: 4, maximum: 4, actual: 2 }),
        entry({ code: 'C', minimum: 4, maximum: 4, actual: 4 }),
      ]),
    );

    expect(rows.map((row) => row.status)).toEqual(['open', 'short', 'met']);
    expect(rows.map((row) => row.note)).toEqual(['noch 4', 'noch 2', 'erfüllt']);
  });

  it('counts a surplus as met and never fills past the track', () => {
    const [row] = group(overview([entry({ minimum: 2, maximum: 2, actual: 5 })])).rows;

    expect(row.status).toBe('met');
    expect(row.fill).toBe(100);
    expect(row.note).toBe('erfüllt');
  });

  it('measures the donut against the lower bound of the whole group', () => {
    const tours = group(
      overview([
        entry({ code: 'A', minimum: 10, maximum: 12, actual: 5 }),
        entry({ code: 'B', minimum: 10, maximum: 10, actual: 5 }),
      ]),
    );

    expect(tours.percent).toBe(50);
    expect(tours.missing).toBe(10);
    expect(tours.status).toBe('short');
  });

  it('pairs every status with an icon, so colour never carries it alone', () => {
    const { rows } = group(
      overview([
        entry({ code: 'A', minimum: 1, maximum: 1, actual: 0 }),
        entry({ code: 'B', minimum: 1, maximum: 1, actual: 1 }),
      ]),
    );

    expect(rows.every((row) => row.icon.startsWith('pi pi-'))).toBe(true);
    expect(new Set(rows.map((row) => row.icon)).size).toBe(2);
  });

  it('keeps kinds without a target out of the rows but reports their total', () => {
    const tours = group(
      overview(
        [entry({ code: 'SKT', minimum: 5, maximum: 5, actual: 2 })],
        [
          entry({ id: null, code: 'BGT', name: 'Bergtour', actual: 32 }),
          entry({ id: null, code: 'KSG', name: 'Klettersteig', actual: 2 }),
        ],
      ),
    );

    expect(tours.rows.map((row) => row.code)).toEqual(['SKT']);
    expect(tours.unplannedLabel).toBe('34 Veranstaltungen in 2 Arten ohne Bedarfsvorgabe');
    expect(tours.actual).toBe(2);
  });

  it('declines the note for a single event of a single kind', () => {
    const tours = group(
      overview(
        [entry({ code: 'SKT', minimum: 5, maximum: 5, actual: 2 })],
        [entry({ id: null, code: 'BGT', name: 'Bergtour', actual: 1 })],
      ),
    );

    expect(tours.unplannedLabel).toBe('1 Veranstaltung in 1 Art ohne Bedarfsvorgabe');
  });

  it('says so when a season has no targets at all', () => {
    const view = panel(overview([]));

    expect(view.hasTargets()).toBe(false);
    expect(view.season()).toBe('2027');
  });

  it('carries the counted program year, which is not the calendar year', () => {
    const view = panel(overview([entry({ minimum: 1, maximum: 1, actual: 0 })]));

    expect(view.periodStart()).toBe('2026-12-01');
    expect(view.periodEnd()).toBe('2027-11-30');
  });

  it('sums a section and spells its stand out for the collapsed header', () => {
    const [section] = panel(
      overview([
        entry({ code: 'A', minimum: 10, maximum: 10, actual: 4 }),
        entry({ code: 'B', minimum: 5, maximum: 5, actual: 1 }),
      ]),
    ).sections();

    expect(section.label).toBe('Winter 2026/27');
    expect(section.summary).toBe('Touren 5/15');
    expect(section.missing).toBe(10);
    expect(section.status).toBe('short');
  });
});
