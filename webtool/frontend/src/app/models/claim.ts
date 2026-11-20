/**
 * Abrechnung einer Tour oder eines Kurses (Backend: server/claims.py), im
 * Aufbau des Formulars "Abrechnung" der Sektion. Beträge kommen als
 * Dezimal-Strings ("40.00"), Daten als ISO-Datum.
 */

/** URL-Segment der API, wie beim Ausdruck. */
export type ClaimKind = 'tours' | 'instructions';

export type Bahncard = 'none' | 'bc25' | 'bc50';

export interface ClaimTrainer {
  id: number;
  name: string;
  /** Kategorie I–IV (1–4) aus der höchsten Qualifikation. */
  level: number;
  phone: string;
  memberId: string;
  qualification: string;
}

export interface ClaimDay {
  date: string;
  hours: number;
  kind: 'day' | 'preliminary';
  /** Keine verwertbaren Zeiten im WebTool: 8 Stunden angenommen. */
  estimated?: boolean;
}

export interface ClaimNight {
  /** Betrag laut Beleg; leer heißt Pauschale. */
  receipt: number | null;
}

export interface ClaimExpense {
  label: string;
  amount: number | null;
}

/** Was der Dialog an das Backend schickt — die korrigierten Angaben. */
export interface ClaimInput {
  trainerId: number | null;
  name: string;
  address: string;
  phone: string;
  memberId: string;
  qualification: string;
  country: string;
  iban: string;
  bank: string;
  level: number;
  days: ClaimDay[];
  nights: ClaimNight[];
  carKm: number;
  bikeKm: number;
  passengerKm: number;
  publicTransport: number | null;
  bahncard: Bahncard;
  travelFrom: string;
  travelTo: string;
  expenses: ClaimExpense[];
  participants: number | null;
  invoiceDate: string | null;
  note: string;
}

export interface ClaimRates {
  tour: { short: string; long: string };
  /** Je Kategorie: Stundensatz bis 3 Std., Pauschale bis 6 Std., Pauschale ab 6 Std. */
  course: Record<string, [string, string, string]>;
  levels: Record<string, string>;
  preliminary: string;
  nightFlat: string;
  nightMax: string;
  kmCar: string;
  kmBike: string;
  kmPassenger: string;
  leitfaden: string;
}

/** Vorbelegung aus den Daten der Veranstaltung (GET …/claim/). */
export interface ClaimDefaults {
  kind: 'tour' | 'course';
  reference: string;
  title: string;
  date: string;
  place: string;
  begin: string;
  end: string;
  leaders: number;
  trainers: ClaimTrainer[];
  trainerId: number | null;
  name: string;
  phone: string;
  memberId: string;
  qualification: string;
  level: number;
  days: (Omit<ClaimDay, 'hours'> & { hours: string })[];
  nights: ClaimNight[];
  carKm: number;
  shuttle: boolean;
  participants: number | null;
  invoiceDate: string;
  rates: ClaimRates;
}

/** Eine Zeile wie im Formular: Kategorie, Satz, Anzahl, Betrag. */
export interface ClaimRow {
  label: string;
  rate: string;
  quantity: string;
  amount: string;
}

/** Die berechnete Abrechnung (POST …/claim/ als JSON). */
export interface ClaimResult {
  /** Betrag je Tag bzw. Nacht, in der Reihenfolge der Eingabe. */
  dayAmounts: string[];
  nightAmounts: string[];
  compensation: ClaimRow[];
  travel: ClaimRow[];
  expenses: ClaimRow[];
  subtotals: { compensation: string; travel: string; expenses: string };
  total: string;
}

/** Die Eingaben aus der Vorbelegung. */
export function inputFromDefaults(defaults: ClaimDefaults): ClaimInput {
  return {
    trainerId: defaults.trainerId,
    name: defaults.name,
    address: '',
    phone: defaults.phone,
    memberId: defaults.memberId,
    qualification: defaults.qualification,
    country: '',
    iban: '',
    bank: '',
    level: defaults.level,
    days: defaults.days.map((day) => ({ ...day, hours: Number(day.hours) })),
    nights: defaults.nights.map((night) => ({ ...night })),
    carKm: defaults.carKm,
    bikeKm: 0,
    passengerKm: 0,
    publicTransport: null,
    bahncard: 'none',
    travelFrom: '',
    travelTo: defaults.place,
    expenses: [],
    participants: defaults.participants,
    invoiceDate: defaults.invoiceDate,
    note: '',
  };
}
