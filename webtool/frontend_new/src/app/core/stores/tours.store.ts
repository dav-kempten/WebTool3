import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import {
  withEntities,
  setEntity,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TourService, CreateTourPayload } from '../services/tour.service';
import { EventsStore } from './events.store';
import { RawTour, Tour, TourSummary } from '../../models/tour';
import { Event } from '../../models/event';

interface ToursState {
  summaries: TourSummary[];
  summariesLoaded: boolean;
}

const initial: ToursState = { summaries: [], summariesLoaded: false };

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

export const ToursStore = signalStore(
  { providedIn: 'root' },
  withState<ToursState>(initial),
  withEntities<Tour>(),
  withComputed((store) => ({
    /** Lookup map id -> Tour (entity detail data). */
    tourById: store.entityMap,
  })),
  withMethods((store) => {
    const tourService = inject(TourService);
    const eventsStore = inject(EventsStore);
    const router = inject(Router);
    const messages = inject(MessageService);

    /** Splits the nested sub-events into the EventsStore and returns the flat UI Tour. */
    function rawToEntity(raw: RawTour): Tour {
      const events: Event[] = [raw.tour, raw.deadline];
      if (raw.preliminary) {
        events.push(raw.preliminary);
      }
      eventsStore.addEvents(events);

      const { tour, deadline, preliminary, admission, advances, extraCharges, ...rest } =
        raw as RawTour & Record<string, unknown>;

      return {
        ...(rest as Omit<Tour, 'tourId' | 'deadlineId' | 'preliminaryId' | 'admission' | 'advances' | 'extraCharges'>),
        tourId: raw.tour.id,
        deadlineId: raw.deadline.id,
        preliminaryId: raw.preliminary ? raw.preliminary.id : null,
        admission: toNumber(admission),
        advances: toNumber(advances),
        extraCharges: toNumber(extraCharges),
      };
    }

    /** Reassembles the wire payload for a PUT save from the current entity + events. */
    function buildSaveBody(tour: Tour): unknown {
      const [tourEvent, deadline, preliminary] = eventsStore
        .eventsByIds([tour.tourId, tour.deadlineId, tour.preliminaryId])
        .map((event) => ({ ...event }));

      if (deadline) {
        deadline.distance = 0;
      }
      if (preliminary) {
        preliminary.distance = 0;
      }

      return {
        ...tour,
        tour: tourEvent,
        deadline,
        preliminary: preliminary ?? null,
        admission: String(tour.admission ?? 0),
        advances: String(tour.advances ?? 0),
        extraCharges: String(tour.extraCharges ?? 0),
      };
    }

    /** Reassembles the wire payload for a clone (POST) directly from a fresh raw tour. */
    function buildCloneBody(raw: RawTour, startDate: string, endDate: string | null): unknown {
      const flat = { ...raw } as RawTour & Record<string, unknown>;
      delete (flat as Record<string, unknown>)['tour'];
      delete (flat as Record<string, unknown>)['deadline'];
      delete (flat as Record<string, unknown>)['preliminary'];

      return {
        ...flat,
        tourId: raw.tour.id,
        deadlineId: raw.deadline.id,
        preliminaryId: raw.preliminary ? raw.preliminary.id : null,
        tour: { ...raw.tour, startDate, endDate: endDate || null },
        deadline: raw.deadline,
        preliminary: raw.preliminary ?? null,
        admission: String(raw.admission ?? 0),
        advances: String(raw.advances ?? 0),
        extraCharges: String(raw.extraCharges ?? 0),
      };
    }

    const loadSummaries = rxMethod<void>(
      pipe(
        switchMap(() =>
          tourService.getTourSummaries().pipe(
            tap((summaries) =>
              patchState(store, { summaries, summariesLoaded: true }),
            ),
          ),
        ),
      ),
    );

    const loadTour = rxMethod<number>(
      pipe(
        switchMap((id) =>
          tourService.getTour(id).pipe(
            tap((raw) => {
              if (raw) {
                patchState(store, setEntity(rawToEntity(raw)));
              }
            }),
          ),
        ),
      ),
    );

    const create = rxMethod<CreateTourPayload>(
      pipe(
        switchMap((payload) =>
          tourService.createTour(payload).pipe(
            tap((tour) => {
              if (tour.id !== 0) {
                loadSummaries();
                void router.navigate(['tours', tour.id]);
              } else {
                messages.add({
                  severity: 'error',
                  summary: 'Tourerstellung fehlgeschlagen',
                  detail: 'Bitte Eingaben noch einmal überprüfen.',
                });
              }
            }),
          ),
        ),
      ),
    );

    const cloneById = rxMethod<{ id: number; startDate: string; endDate: string | null }>(
      pipe(
        switchMap(({ id, startDate, endDate }) =>
          tourService.getTour(id).pipe(
            switchMap((raw) => {
              if (!raw) {
                messages.add({
                  severity: 'error',
                  summary: 'Klonen fehlgeschlagen',
                  detail: 'Die Quelltour konnte nicht geladen werden.',
                });
                return EMPTY;
              }
              return tourService.cloneTour(buildCloneBody(raw, startDate, endDate)).pipe(
                tap((created) => {
                  if (created.id !== 0) {
                    loadSummaries();
                    void router.navigate(['tours', created.id]);
                  } else {
                    messages.add({
                      severity: 'error',
                      summary: 'Klonen fehlgeschlagen',
                      detail: 'Die Tour konnte nicht kopiert werden.',
                    });
                  }
                }),
              );
            }),
          ),
        ),
      ),
    );

    const remove = rxMethod<number>(
      pipe(
        switchMap((id) =>
          tourService.deleteTour(id).pipe(
            tap((ok) => {
              if (ok) {
                patchState(store, removeEntity(id));
                loadSummaries();
                void router.navigate(['tours']);
              }
            }),
          ),
        ),
      ),
    );

    const save = rxMethod<{ tour: Tour; silent?: boolean }>(
      pipe(
        switchMap(({ tour, silent }) =>
          tourService.upsertTour(tour.id, buildSaveBody(tour)).pipe(
            tap((raw) => {
              if (raw) {
                patchState(store, setEntity(rawToEntity(raw)));
                loadSummaries();
                if (!silent) {
                  messages.add({
                    severity: 'success',
                    summary: 'Gespeichert',
                    detail: 'Die Tour wurde erfolgreich gespeichert.',
                  });
                }
              } else if (!silent) {
                messages.add({
                  severity: 'error',
                  summary: 'Speichern fehlgeschlagen',
                  detail: 'Bitte erneut versuchen oder die Seite neu laden.',
                });
              }
            }),
          ),
        ),
      ),
    );

    return {
      loadSummaries,
      ensureSummaries(): void {
        if (!store.summariesLoaded()) {
          loadSummaries();
        }
      },
      loadTour,
      /** Live edit buffer: mirror form changes into the entity without a network call. */
      updateLocal(id: number, changes: Partial<Tour>): void {
        patchState(store, updateEntity({ id, changes }));
      },
      updateEventLocal(id: number, changes: Partial<Event>): void {
        eventsStore.updateEvent(id, changes);
      },
      create,
      cloneById,
      remove,
      save,
    };
  }),
);
