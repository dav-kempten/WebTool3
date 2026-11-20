import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Approximate } from '../../../models/value';
import { ResponsiveTooltip } from '../../directives/responsive-tooltip';
import { RendezvousInput } from '../rendezvous-input/rendezvous-input';
import { TimeInput } from '../time-input/time-input';

/** Die Häkchen, die ein Termin haben kann — jeweils ein boolesches Formularfeld. */
export type EventCheckbox = 'reservationService' | 'lea' | 'distal' | 'publicTransport' | 'shuttleService';

const CHECKBOXES: Record<EventCheckbox, { label: string; tooltip: string }> = {
  reservationService: { label: 'Schulungsraum', tooltip: 'Reservierungswunsch für den Schulungsraum' },
  lea: { label: 'Low Emission Adventure', tooltip: '' },
  distal: { label: 'Gemeinschaftsanreise', tooltip: '' },
  publicTransport: { label: 'Öffentliche Anreise', tooltip: '' },
  shuttleService: { label: 'Alpin-Shuttle', tooltip: 'Reservierungswunsch für das Alpin-Shuttle' },
};

/**
 * Was ein Termin-Dialog zeigt. Jede Seite (Tour, Kurs, Gruppentermin) gibt nur
 * die Teile an, die sie braucht; Reihenfolge und Aufbau sind überall gleich.
 */
export interface EventFieldsConfig {
  /** Tooltips für Kurz- und Langtitel; ohne sie entfallen die Titel. */
  titles?: { title: string; name: string };
  /** "Tageszeit (ca.)" neben Start- und Endzeit. */
  approximate?: boolean;
  /** Tooltip des Enddatums; ohne ihn gibt es kein Enddatum. */
  endDate?: string;
  /** Bezeichnung des Felds `source` (Ausgangspunkt, Kursort); ohne sie entfällt es. */
  sourceLabel?: string;
  /** Tooltip am Feld `source`. */
  sourceTooltip?: string;
  /** Bezeichnung des Felds `location` (Übernachtungsort, Ort). */
  locationLabel: string;
  /**
   * Hinweis unter einem Ortsfeld, wo es auf der Homepage landet — bekommt die
   * Bezeichnung auf der Homepage (Treffpunkt, Kursort, Übernachtung). Ohne
   * die Funktion gibt es keine Hinweise.
   */
  placeHint?: (homepageLabel: string) => string;
  /** Die Häkchen in dieser Reihenfolge. */
  checkboxes?: EventCheckbox[];
  /** Tooltip der Gesamtfahrstrecke; ohne ihn entfällt das Feld. */
  distance?: string;
  /** Tourenportal-Link. */
  link?: boolean;
  /** Kartenausschnitt-URL. */
  map?: boolean;
  /** Beschreibung: Zeilenzahl und optionaler Hinweis darunter. */
  description?: { rows: number; hint?: string };
}

/**
 * Die gemeinsamen Felder der Termin-Dialoge von Touren, Kursen und
 * Gruppenterminen, immer in derselben Reihenfolge:
 * Titel → Tageszeit/Start/Ende → Start-/Enddatum → Orte → Anreise-Häkchen →
 * Fahrstrecke/Tourenportal/Karte → Beschreibung.
 *
 * Die Felder hängen an der übergebenen FormGroup; was die Seite nicht
 * anzeigen lässt, bleibt im Formular unverändert stehen.
 */
@Component({
  selector: 'avk-event-fields',
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    DatePickerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
    ResponsiveTooltip,
    RendezvousInput,
    TimeInput,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './event-fields.html',
  styleUrls: ['../../styles/detail-page.scss', './event-fields.scss'],
})
export class EventFields {
  readonly form = input.required<FormGroup>();
  readonly config = input.required<EventFieldsConfig>();
  readonly approximateOptions = input<Approximate[]>([]);
  /** Frühestes wählbares Startdatum. */
  readonly minDate = input<Date | null>(null);

  readonly checkboxes = computed(() =>
    (this.config().checkboxes ?? []).map((name) => ({ name, ...CHECKBOXES[name] })),
  );

  /** Zahl der Felder in der Zeile Fahrstrecke/Tourenportal/Karte. */
  readonly extras = computed(() => {
    const c = this.config();
    return [c.distance, c.link, c.map].filter(Boolean).length;
  });

  /** Eindeutige ids für die Häkchen, falls zwei Dialoge zugleich im DOM stehen. */
  private static nextId = 0;
  readonly idPrefix = `avk-event-${EventFields.nextId++}-`;
}
