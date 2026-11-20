import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
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
 * Eingabefeld für eine Uhrzeit im Format `HH:MM` (der Wert im Formular bleibt
 * ein String wie bisher). Die Zeit lässt sich tippen — beim Verlassen des Felds
 * wird sie vereinheitlicht — oder über den Uhr-Knopf mit einem Zeitpicker
 * wählen.
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
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimeInput), multi: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-inputgroup>
      <input
        pInputText
        [value]="value()"
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
    <p-popover #popover appendTo="body">
      <p-datepicker
        [ngModel]="pickerDate()"
        (ngModelChange)="onPick($event)"
        [inline]="true"
        [timeOnly]="true"
        hourFormat="24"
        [stepMinute]="5"
      />
    </p-popover>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    input {
      flex: 1 1 auto;
      min-width: 0;
    }
  `,
})
export class TimeInput implements ControlValueAccessor {
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
    date.setHours(hours, minutes, 0, 0);
    return date;
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

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
      this.set(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
      this.onTouched();
    }
  }

  private set(text: string): void {
    this.value.set(text);
    this.onChange(text);
  }
}
