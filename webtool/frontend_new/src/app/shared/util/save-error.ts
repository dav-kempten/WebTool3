import { HttpErrorResponse } from '@angular/common/http';

/** A single validation-error leaf from a DRF response, with its full key path. */
export interface SaveError {
  path: string[];
  messages: string[];
}

/** Result of a save HTTP call: either the saved entity, or the validation errors that blocked it. */
export interface SaveResult<T> {
  data: T | null;
  errors: SaveError[];
}

/** Builds a failed SaveResult from an HttpErrorResponse, keeping the field-level detail. */
export function toSaveError<T>(error: HttpErrorResponse): SaveResult<T> {
  return { data: null, errors: extractSaveErrors(error.error) };
}

/** Flattens a DRF validation-error body (nested per sub-serializer/array) into leaves. */
function extractSaveErrors(body: unknown, path: string[] = []): SaveError[] {
  if (Array.isArray(body)) {
    if (body.length && body.every((item) => typeof item === 'string')) {
      return [{ path, messages: body as string[] }];
    }
    return body.flatMap((item, index) => extractSaveErrors(item, [...path, String(index)]));
  }
  if (body && typeof body === 'object') {
    return Object.entries(body as Record<string, unknown>).flatMap(([key, value]) =>
      extractSaveErrors(value, [...path, key]),
    );
  }
  if (typeof body === 'string' && path.length) {
    return [{ path, messages: [body] }];
  }
  return [];
}

/** German labels for the field/event keys used across tour, instruction and session forms. */
const FIELD_LABELS: Record<string, string> = {
  nonFieldErrors: 'Allgemein',
  detail: 'Allgemein',
  guideId: 'Leiter',
  teamIds: 'Team',
  categoryId: 'Kategorie',
  categoryIds: 'Tourenart',
  info: 'Zusatzinfo',
  stateId: 'Status',
  skillId: 'Können',
  fitnessId: 'Kondition',
  qualificationIds: 'Mindestqualifikation',
  preconditions: 'Zusätzliche Anforderungen',
  equipmentIds: 'Ausrüstung',
  miscEquipment: 'Zusatzausrüstung',
  admission: 'Teilnahmegebühr',
  extraCharges: 'Zusatzkosten',
  advances: 'Vorauszahlung',
  extraChargesInfo: 'Info Zusatzkosten',
  advancesInfo: 'Info Vorauszahlung',
  title: 'Kurztitel',
  name: 'Langtitel',
  description: 'Beschreibung',
  startDate: 'Startdatum',
  startTime: 'Startzeit',
  endDate: 'Enddatum',
  endTime: 'Endzeit',
  approximateId: 'Tageszeit (ca.)',
  rendezvous: 'Treffpunkt',
  location: 'Ort',
  reservationService: 'Reservierungsservice',
  distance: 'Strecke',
  shuttleService: 'Shuttleservice',
  link: 'Link',
  topicId: 'Thema',
  tour: 'Haupttermin',
  deadline: 'Anmeldeschluss',
  preliminary: 'Vorbesprechung',
  instruction: 'Haupttermin',
  meetings: 'Kurstermin',
  session: 'Gruppentermin',
};

/** e.g. `["meetings", "1", "startTime"]` -> `"Kurstermin 2 – Startzeit"`. */
export function describeSaveErrorPath(path: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    if (/^\d+$/.test(segment)) {
      const prevLabel = parts.pop() ?? FIELD_LABELS[path[i - 1]] ?? path[i - 1];
      parts.push(`${prevLabel} ${Number(segment) + 1}`);
    } else {
      parts.push(FIELD_LABELS[segment] ?? segment);
    }
  }
  return parts.join(' – ');
}
