import { signalStore, withMethods, patchState } from '@ngrx/signals';
import {
  withEntities,
  setEntity,
  setEntities,
  updateEntity,
} from '@ngrx/signals/entities';
import { Event } from '../../models/event';

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
      patchState(store, updateEntity({ id, changes }));
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
