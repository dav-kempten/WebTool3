import { TestBed } from '@angular/core/testing';
import { ReadyChecklistDialog } from './ready-checklist-dialog';

function create(multiDay: boolean) {
  const fixture = TestBed.createComponent(ReadyChecklistDialog);
  fixture.componentRef.setInput('kind', 'Kurs');
  fixture.componentRef.setInput('multiDay', multiDay);
  fixture.componentRef.setInput('extraCharges', 25);
  return fixture.componentInstance;
}

describe('ReadyChecklistDialog', () => {
  it('asks two questions for a one-day event and five for a multi-day one', () => {
    expect(create(false).items().map((i) => i.key)).toEqual(['extraCharges', 'equipment']);
    expect(create(true).items().map((i) => i.key)).toEqual([
      'extraCharges', 'cancellation', 'advances', 'overnight', 'equipment',
    ]);
  });

  it('names the overnight checkbox of the form it belongs to', () => {
    const course = create(true);
    expect(course.items().find((i) => i.key === 'overnight')?.label).toContain(
      '„Kurs mit Übernachtung“ bei den Kursspezifika',
    );
    expect(course.items().find((i) => i.key === 'overnight')?.hint).toBe(
      '„Kurs mit Übernachtung“ ist nicht angehakt',
    );

    const fixture = TestBed.createComponent(ReadyChecklistDialog);
    fixture.componentRef.setInput('kind', 'Tour');
    fixture.componentRef.setInput('multiDay', true);
    fixture.componentRef.setInput('overnight', true);
    const tour = fixture.componentInstance.items().find((i) => i.key === 'overnight');
    expect(tour?.label).toContain('„Übernachtungstour“ bei den Tourenspezifika');
    expect(tour?.hint).toBe('„Übernachtungstour“ ist angehakt');
  });

  it('only confirms once every item is ticked', () => {
    const dialog = create(true);
    let confirmed = 0;
    dialog.confirmed.subscribe(() => confirmed++);

    dialog.toggle('extraCharges', true);
    dialog.toggle('cancellation', true);
    dialog.toggle('advances', true);
    dialog.toggle('overnight', true);
    expect(dialog.allChecked()).toBe(false);
    dialog.confirm();
    expect(confirmed).toBe(0);

    dialog.toggle('equipment', true);
    expect(dialog.allChecked()).toBe(true);
    dialog.confirm();
    expect(confirmed).toBe(1);
  });

  it('starts unticked every time it opens', () => {
    const dialog = create(false);
    dialog.toggle('extraCharges', true);
    dialog.toggle('equipment', true);
    dialog.onShow();
    expect(dialog.allChecked()).toBe(false);
  });

  it('shows the amount currently entered', () => {
    expect(create(false).items()[0].hint).toBe('Aktuell eingetragen: 25 €');
  });
});
