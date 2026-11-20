import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { ResponsiveTooltip } from '../../directives/responsive-tooltip';

/** Uhrzeit, die der Picker zeigt, solange das Feld leer ist. */
const PICKER_DEFAULT = '08:00';

/**
 * Macht aus einer getippten Uhrzeit `HH:MM`, wenn sie sich eindeutig lesen
 * lässt: "9" → 09:00, "930" → 09:30, "9.30" / "9:30" / "9 30" → 09:30.
 * Alles andere bleibt unverändert stehen, damit der Formatvalidator es meldet.
 */
export function normalizeTime(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const match = /^(\d{1,2})(?:[.:, h]?(\d{2}))?$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return trimmed;
  }
  return `${pad(hours)}:${pad(minutes)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Rundet auf die nächste Viertelstunde, höchstens auf 23:45. Der Picker bietet
 * nur Viertelstunden an; getippt werden darf weiterhin jede Minute.
 */
export function toQuarterHour(hours: number, minutes: number): [number, number] {
  const total = Math.min(Math.round((hours * 60 + minutes) / 15) * 15, 23 * 60 + 45);
  return [Math.floor(total / 60), total % 60];
}

/**
 * Eingabefeld für eine Uhrzeit im Format `HH:MM` (der Wert im Formular bleibt
 * ein String wie bisher). Die Zeit lässt sich tippen — beim Verlassen des Felds
 * wird sie vereinheitlicht — oder über den Uhr-Knopf mit einem Zeitpicker
 * wählen — dort nur in Viertelstunden.
 */
@Component({
  selector: 'avk-time-input',
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    PopoverModule,
    TooltipModule,
    ResponsiveTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-inputgroup>
      <input
        pInputText
        [value]="value()"
        [class.p-invalid]="showsFormatError()"
        [disabled]="disabled()"
        placeholder="HH:MM"
        maxlength="5"
        inputmode="numeric"
        [pTooltip]="tooltip()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <p-inputgroup-addon>
        <p-button
          icon="pi pi-clock"
          severity="secondary"
          [disabled]="disabled()"
          ariaLabel="Uhrzeit auswählen"
          (onClick)="popover.toggle($event)"
        />
      </p-inputgroup-addon>
    </p-inputgroup>
    @if (showsFormatError()) {
      <small class="avk-time-error">Bitte als Uhrzeit HH:MM eintragen, z. B. 09:30.</small>
    }
    <p-popover #popover appendTo="body">
      <p-datepicker
        [ngModel]="pickerDate()"
        (ngModelChange)="onPick($event)"
        [inline]="true"
        [timeOnly]="true"
        hourFormat="24"
        [stepMinute]="15"
      />
    </p-popover>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .avk-time-error {
      display: block;
      margin-top: 0.35rem;
      color: var(--p-red-500, #ef4444);
    }
    input {
      flex: 1 1 auto;
      min-width: 0;
    }
  `,
})
export class TimeInput implements ControlValueAccessor {
  /**
   * Der Formular-Control, an dem das Feld hängt — darüber liest es den
   * Formatfehler des `timeFormatValidator`. Statt NG_VALUE_ACCESSOR meldet
   * sich die Komponente selbst als Value Accessor an; beides zugleich ergäbe
   * eine zirkuläre Abhängigkeit.
   */
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  /** Tooltip am Eingabefeld. */
  readonly tooltip = input('');

  readonly value = signal('');
  readonly disabled = signal(false);

  /** Der Picker arbeitet mit einem Date; nur Stunde und Minute zählen. */
  readonly pickerDate = computed(() => {
    const [hours, minutes] = (/^\d{2}:\d{2}$/.test(this.value()) ? this.value() : PICKER_DEFAULT)
      .split(':')
      .map(Number);
    const date = new Date();
    date.setHours(...toQuarterHour(hours, minutes), 0, 0);
    return date;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  /**
   * Meldung erst nach dem Verlassen des Felds, damit sie nicht schon beim
   * Tippen der ersten Ziffer erscheint. Die Prüfung selbst bleibt beim
   * `timeFormatValidator` des Formulars.
   */
  showsFormatError(): boolean {
    const control = this.ngControl;
    return !!control && !!control.touched && !!control.hasError('timeFormat');
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  onInput(event: Event): void {
    this.set((event.target as HTMLInputElement).value);
  }

  onBlur(): void {
    const normalized = normalizeTime(this.value());
    if (normalized !== this.value()) {
      this.set(normalized);
    }
    this.onTouched();
  }

  onPick(date: Date | null): void {
    if (date) {
      const [hours, minutes] = toQuarterHour(date.getHours(), date.getMinutes());
      this.set(`${pad(hours)}:${pad(minutes)}`);
      this.onTouched();
    }
  }

  private set(text: string): void {
    this.value.set(text);
    this.onChange(text);
  }
}
