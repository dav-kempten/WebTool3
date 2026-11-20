import { Component, DestroyRef, computed, effect, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, filter, of, switchMap } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ResponsiveTooltip } from '../../directives/responsive-tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ClaimService } from '../../../core/services/claim.service';
import {
  ClaimDay,
  ClaimDefaults,
  ClaimExpense,
  ClaimInput,
  ClaimKind,
  ClaimResult,
  inputFromDefaults,
} from '../../../models/claim';
import { formatIban, isValidIban } from '../../util/iban';

/**
 * Abrechnung einer Tour oder eines Kurses, im Aufbau des Formulars der
 * Sektion. Der Dialog übernimmt die Daten der Veranstaltung, lässt sie
 * korrigieren (Stunden, km, Übernachtungen, Belege …), zeigt laufend die
 * Berechnung nach dem Abrechnungsleitfaden und erzeugt das PDF zum
 * Unterschreiben. Gespeichert wird nichts — Anschrift und IBAN gehen nur in
 * dieses eine PDF.
 */
@Component({
  selector: 'avk-claim-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
    ResponsiveTooltip,
  ],
  templateUrl: './claim-dialog.html',
  styleUrl: './claim-dialog.scss',
})
export class ClaimDialog {
  private claims = inject(ClaimService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly kind = input.required<ClaimKind>();
  readonly eventId = input.required<number>();
  readonly visible = model(false);

  readonly defaults = signal<ClaimDefaults | null>(null);
  readonly claim = signal<ClaimInput | null>(null);
  readonly result = signal<ClaimResult | null>(null);
  readonly loadError = signal(false);
  readonly downloading = signal(false);

  readonly isCourse = computed(() => this.defaults()?.kind === 'course');
  /** Die Geschäftsstelle rechnet für jede Person der Leitung ab, Trainer nur für sich. */
  readonly canChooseTrainer = computed(
    () => this.auth.isOfficeOrAbove() && (this.defaults()?.trainers.length ?? 0) > 1,
  );
  readonly levelOptions = computed(() =>
    Object.entries(this.defaults()?.rates.levels ?? {}).map(([level, name]) => ({
      value: Number(level),
      label: name,
    })),
  );
  readonly dayKinds = [
    { value: 'day', label: 'Kurstag' },
    { value: 'preliminary', label: 'Vorbespr.' },
  ];
  readonly bahncards = [
    { value: 'none', label: 'ohne BahnCard' },
    { value: 'bc25', label: 'BahnCard 25 (× 105 %)' },
    { value: 'bc50', label: 'BahnCard 50 (× 110 %)' },
  ];
  /** Die Kategorie, die aus der Qualifikation der gewählten Person folgt. */
  readonly suggestedLevel = computed(() => {
    const claim = this.claim();
    return this.defaults()?.trainers.find((t) => t.id === claim?.trainerId)?.level ?? null;
  });
  readonly hasEstimatedDays = computed(() => this.claim()?.days.some((d) => d.estimated) ?? false);
  /** Leer ist erlaubt (dann "lt. Mitgliederverwaltung" bzw. von Hand), sonst muss sie stimmen. */
  readonly ibanInvalid = computed(() => {
    const iban = this.claim()?.iban ?? '';
    return iban.trim() !== '' && !isValidIban(iban);
  });

  constructor() {
    // Bei jedem Öffnen frisch aus den Daten der Veranstaltung vorbelegen.
    effect(() => {
      if (this.visible()) {
        this.load();
      }
    });

    // Vorschau: kurz nach jeder Änderung neu rechnen lassen. Mit ungültiger
    // IBAN würde das Backend die Rechnung ablehnen, sie geht daher ohne IBAN.
    toObservable(this.claim)
      .pipe(
        filter((claim): claim is ClaimInput => claim !== null),
        debounceTime(300),
        switchMap((claim) =>
          this.claims
            .preview(this.kind(), this.eventId(), { ...clean(claim), iban: '' })
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.result.set(result));
  }

  private load(): void {
    this.defaults.set(null);
    this.claim.set(null);
    this.result.set(null);
    this.loadError.set(false);
    this.claims.defaults(this.kind(), this.eventId()).subscribe({
      next: (defaults) => {
        this.defaults.set(defaults);
        this.claim.set(inputFromDefaults(defaults));
      },
      error: () => this.loadError.set(true),
    });
  }

  /** Ändert die Eingaben unveränderlich, damit Vorschau und Anzeige folgen. */
  update(change: (claim: ClaimInput) => void): void {
    const current = this.claim();
    if (!current) {
      return;
    }
    const next = structuredClone(current);
    change(next);
    this.claim.set(next);
  }

  patch(change: Partial<ClaimInput>): void {
    this.update((c) => Object.assign(c, change));
  }

  chooseTrainer(id: number): void {
    const trainer = this.defaults()?.trainers.find((t) => t.id === id);
    this.update((c) => {
      c.trainerId = id;
      c.name = trainer?.name ?? '';
      c.phone = trainer?.phone ?? '';
      c.memberId = trainer?.memberId ?? '';
      c.qualification = trainer?.qualification ?? '';
      c.level = trainer?.level ?? c.level;
    });
  }

  /** Beim Verlassen des Felds in Vierergruppen bringen, wenn sie stimmt. */
  tidyIban(): void {
    const iban = this.claim()?.iban ?? '';
    if (isValidIban(iban)) {
      this.patch({ iban: formatIban(iban) });
    }
  }

  setDay(index: number, patch: Partial<ClaimDay>): void {
    // Wer die Stunden anfasst, hat sie geprüft: der Hinweis "geschätzt" entfällt.
    this.update((c) => Object.assign(c.days[index], patch, 'hours' in patch ? { estimated: false } : {}));
  }

  addDay(): void {
    this.update((c) => {
      const last = c.days.at(-1)?.date ?? c.invoiceDate ?? new Date().toISOString().slice(0, 10);
      c.days.push({ date: last, hours: 8, kind: 'day' });
    });
  }

  removeDay(index: number): void {
    this.update((c) => c.days.splice(index, 1));
  }

  setNight(index: number, receipt: number | null): void {
    this.update((c) => (c.nights[index].receipt = receipt));
  }

  addNight(): void {
    this.update((c) => c.nights.push({ receipt: null }));
  }

  removeNight(index: number): void {
    this.update((c) => c.nights.splice(index, 1));
  }

  setExpense(index: number, patch: Partial<ClaimExpense>): void {
    this.update((c) => Object.assign(c.expenses[index], patch));
  }

  addExpense(): void {
    this.update((c) => c.expenses.push({ label: '', amount: null }));
  }

  removeExpense(index: number): void {
    this.update((c) => c.expenses.splice(index, 1));
  }

  dayAmount(index: number): string {
    return euro(this.result()?.dayAmounts[index]);
  }

  nightAmount(index: number): string {
    return euro(this.result()?.nightAmounts[index]);
  }

  euro(value: string | undefined): string {
    return euro(value);
  }

  download(): void {
    const claim = this.claim();
    if (!claim || this.downloading() || this.ibanInvalid()) {
      return;
    }
    this.downloading.set(true);
    this.claims.download(this.kind(), this.eventId(), clean(claim), () => this.downloading.set(false));
  }
}

/** Was das Backend erwartet: ohne Anzeige-Felder, leere Zahlen als null bzw. 0. */
function clean(claim: ClaimInput): ClaimInput {
  return {
    ...claim,
    days: claim.days.map(({ estimated: _, ...day }) => ({ ...day, hours: day.hours ?? 0 })),
    nights: claim.nights.map((night) => ({ receipt: night.receipt ?? null })),
    expenses: claim.expenses.map((expense) => ({ ...expense, amount: expense.amount ?? 0 })),
    carKm: claim.carKm ?? 0,
    bikeKm: claim.bikeKm ?? 0,
    passengerKm: claim.passengerKm ?? 0,
  };
}

function euro(value: string | undefined): string {
  if (value == null) {
    return '';
  }
  return `${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
