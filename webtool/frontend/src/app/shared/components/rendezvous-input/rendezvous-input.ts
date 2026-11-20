import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { ResponsiveTooltip } from '../../directives/responsive-tooltip';

/** Die Treffpunkte, die fast immer gemeint sind. */
export const STANDARD_RENDEZVOUS = [
  'Alpinzentrum Kempten, Seminarraum',
  'Alpinzentrum Kempten, Parkplatz',
] as const;

/** `LocationField` im Backend (`server/models/fields.py`): max_length=75. */
export const RENDEZVOUS_MAX_LENGTH = 75;

/**
 * Freitextfeld für den Treffpunkt mit einem Knopf, der die Standard-Treffpunkte
 * anbietet. Eine Auswahl schreibt den Text nur ins Feld — er lässt sich danach
 * weiter bearbeiten, und alles andere bleibt frei eintragbar.
 *
 * Bewusst ein natives Eingabefeld statt `p-autocomplete`: nur so greift
 * `maxlength` direkt beim Tippen und beim Einfügen.
 */
@Component({
  selector: 'avk-rendezvous-input',
  imports: [
    ButtonModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MenuModule,
    TooltipModule,
    ResponsiveTooltip,
  ],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RendezvousInput), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-inputgroup>
      <input
        pInputText
        [value]="value()"
        [disabled]="disabled()"
        [attr.maxlength]="maxLength"
        [pTooltip]="tooltip()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <p-inputgroup-addon>
        <p-button
          icon="pi pi-chevron-down"
          severity="secondary"
          [disabled]="disabled()"
          ariaLabel="Standard-Treffpunkt wählen"
          pTooltip="Standard-Treffpunkt wählen"
          (onClick)="menu.toggle($event)"
        />
      </p-inputgroup-addon>
    </p-inputgroup>
    <p-menu #menu [model]="items" [popup]="true" appendTo="body" />
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
export class RendezvousInput implements ControlValueAccessor {
  /** Tooltip am Eingabefeld. */
  readonly tooltip = input('');

  readonly maxLength = RENDEZVOUS_MAX_LENGTH;
  readonly value = signal('');
  readonly disabled = signal(false);

  readonly items: MenuItem[] = STANDARD_RENDEZVOUS.map((label) => ({
    label,
    command: () => this.choose(label),
  }));

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChange(text);
  }

  private choose(text: string): void {
    this.value.set(text);
    this.onChange(text);
    this.onTouched();
  }
}
