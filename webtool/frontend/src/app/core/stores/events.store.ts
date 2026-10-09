import { signalStore, withMethods, patchState } from '@ngrx/signals';
import {
  withEntities,
  setEntity,
  setEntities,
  updateEntity,
} from '@ngrx/signals/entities';
import { Event } from '../../models/event';

/**
 * A cleared time input yields '' (or whitespace), but the backend's TimeField
 * only takes "HH:MM" or null and rejects '' — the whole save would fail.
 * Every form writes its event edits through updateEvent(), so normalising here
 * covers tours, courses and sessions alike.
 */
export function withoutEmptyTimes(changes: Partial<Event>): Partial<Event> {
  const result = { ...changes };
  for (const key of ['startTime', 'endTime'] as const) {
    const value = result[key];
    if (typeof value === 'string' && value.trim() === '') {
      result[key] = null;
    }
  }
  return result;
}

export const EventsStore = signalStore(
  { providedIn: 'root' },
  withEntities<Event>(),
  withMethods((store) => ({
    addEvent(event: Event): void {
      patchState(store, setEntity(event));
    },
    addEvents(events: Event[]): void {
      patchState(store, setEntities(events));
    },
    updateEvent(id: number, changes: Partial<Event>): void {
      patchState(store, updateEntity({ id, changes: withoutEmptyTimes(changes) }));
    },
    /** Resolves events for the given ids, preserving the requested order. */
    eventsByIds(ids: (number | null | undefined)[]): Event[] {
      const map = store.entityMap();
      return ids
        .filter((id): id is number => id != null)
        .map((id) => map[id])
        .filter((event): event is Event => !!event);
    },
  })),
);
