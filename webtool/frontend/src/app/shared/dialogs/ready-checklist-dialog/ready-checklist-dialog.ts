import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';

interface ChecklistItem {
  key: string;
  label: string;
  /** What the form currently says, so the guide does not have to scroll back. */
  hint: string;
}

/**
 * Checklist a guide ticks off before handing a tour or course in as "Fertig".
 * The confirm button stays disabled until every item is ticked; the items on
 * accommodation and advances only apply to events spanning several days.
 */
@Component({
  selector: 'avk-ready-checklist-dialog',
  standalone: true,
  imports: [FormsModule, ButtonModule, CheckboxModule, DialogModule],
  templateUrl: './ready-checklist-dialog.html',
  styleUrl: './ready-checklist-dialog.scss',
})
export class ReadyChecklistDialog {
  readonly visible = model(false);
  /** "Tour" or "Kurs" — used in the texts. */
  readonly kind = input.required<'Tour' | 'Kurs'>();
  readonly multiDay = input(false);
  readonly extraCharges = input<number | null>(null);
  readonly advances = input<number | null>(null);
  readonly equipmentService = input(false);

  /** Emitted once all items are ticked and the guide confirms. */
  readonly confirmed = output<void>();

  private readonly checked = signal<Record<string, boolean>>({});

  readonly items = computed<ChecklistItem[]>(() => {
    const items: ChecklistItem[] = [
      {
        key: 'extraCharges',
        label: 'Zusatzkosten angegeben? (Alles, was anfallen kann – ohne Fahrtkosten)',
        hint: `Aktuell eingetragen: ${euro(this.extraCharges())}`,
      },
    ];
    if (this.multiDay()) {
      items.push(
        {
          key: 'cancellation',
          label:
            'Stornobedingungen für die Unterkunft in „Nachricht an die Geschäftsstelle“ angegeben, falls es welche gibt?',
          hint: 'Mehrtägige Veranstaltung',
        },
        {
          key: 'advances',
          label: 'Ist die Anzahlung angegeben, die jeder Teilnehmer für die Veranstaltung leisten muss?',
          hint: `Aktuell eingetragen: ${euro(this.advances())}`,
        },
      );
    }
    items.push({
      key: 'equipment',
      label: 'Wenn ich als Trainer Ausrüstung brauche: Ausrüstungsbedarf der Geschäftsstelle mitgeteilt?',
      hint: this.equipmentService()
        ? `„Ausrüstungsbedarf ${this.kind()}“ ist angehakt`
        : `„Ausrüstungsbedarf ${this.kind()}“ ist nicht angehakt`,
    });
    return items;
  });

  readonly allChecked = computed(() => {
    const checked = this.checked();
    return this.items().every((item) => checked[item.key]);
  });

  isChecked(key: string): boolean {
    return !!this.checked()[key];
  }

  toggle(key: string, value: boolean): void {
    this.checked.update((checked) => ({ ...checked, [key]: value }));
  }

  /** Every opening starts unticked: the list is meant to be gone through each time. */
  onShow(): void {
    this.checked.set({});
  }

  confirm(): void {
    if (!this.allChecked()) {
      return;
    }
    this.visible.set(false);
    this.confirmed.emit();
  }
}

function euro(value: number | null): string {
  return `${Number(value ?? 0).toLocaleString('de-DE')} €`;
}
