import { TestBed } from '@angular/core/testing';
import { ActivityPreview } from '../../../models/preview';
import { HomepagePreviewDialog, homepageDateRange } from './homepage-preview-dialog';

describe('homepageDateRange', () => {
  it('writes dates the way the homepage does', () => {
    expect(homepageDateRange('2026-10-30', '2026-11-03')).toBe('30.10. – 03.11.2026');
    expect(homepageDateRange('2026-12-30', '2027-01-02')).toBe('30.12.2026 – 02.01.2027');
    expect(homepageDateRange('2026-11-07', null)).toBe('07.11.2026');
    expect(homepageDateRange('2026-11-07', '2026-11-07')).toBe('07.11.2026');
  });
});

describe('HomepagePreviewDialog', () => {
  it('fills the facts list like the homepage', () => {
    const fixture = TestBed.createComponent(HomepagePreviewDialog);
    fixture.componentRef.setInput('preview', {
      id: 'VHF-608',
      title: 'Grundkurs - Von der Halle an den Fels',
      startDate: '2026-10-30',
      endDate: '2026-11-03',
      quantity: { min: 6, max: 8, current: 0 },
      admission: 205,
      guide: { firstName: 'Lina', lastName: 'Wansel' },
    } as ActivityPreview);
    const dialog = fixture.componentInstance;
    expect(dialog.dates()).toBe('30.10. – 03.11.2026');
    expect(dialog.participants()).toBe('6 bis 8 Personen');
    expect(dialog.fee()).toBe('205 €');
    expect(dialog.guide()).toBe('Lina Wansel');
  });

  it('fills the sidebar like the homepage: levels 1–3 and equipment with extras', () => {
    const fixture = TestBed.createComponent(HomepagePreviewDialog);
    fixture.componentRef.setInput('preview', {
      skill: 3,
      fitness: 99,
      equipments: {
        list: [{ code: 'A', name: 'Wandern und Bergsteigen' }],
        misc: 'Helm zwingend erforderlich',
      },
    } as ActivityPreview);
    const dialog = fixture.componentInstance;
    expect(dialog.skillLevel()).toBe(3);
    // 99 means "not specified" and is not drawn.
    expect(dialog.fitnessLevel()).toBeNull();
    expect(dialog.equipment()).toEqual(['Wandern und Bergsteigen (A)', 'Helm zwingend erforderlich']);
  });
});
