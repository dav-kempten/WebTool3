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
import { SaveError, describeSaveError } from '../../shared/util/save-error';

interface ToursState {
  summaries: TourSummary[];
  summariesLoaded: boolean;
  lastSaveErrors: SaveError[];
}

const initial: ToursState = { summaries: [], summariesLoaded: false, lastSaveErrors: [] };

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
    function buildSaveBody(
      tour: Tour,
      mutate?: (events: { tourEvent: Event; deadline: Event; preliminary: Event | null }) => void,
    ): unknown {
      const [tourEvent, deadline, preliminary] = eventsStore
        .eventsByIds([tour.tourId, tour.deadlineId, tour.preliminaryId])
        .map((event) => ({ ...event })) as [Event, Event, Event | undefined];

      if (deadline) {
        deadline.distance = 0;
      }
      if (preliminary) {
        preliminary.distance = 0;
      }

      const events = { tourEvent, deadline, preliminary: preliminary ?? null };
      if (mutate) {
        mutate(events);
      }

      return {
        ...tour,
        tour: events.tourEvent,
        deadline: events.deadline,
        preliminary: events.preliminary,
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

    /**
     * Mirrors the summary-visible subset of a local edit into the list row,
     * so the list views update immediately instead of after the next save.
     */
    function syncSummary(id: number, changes: Partial<TourSummary>): void {
      const defined = Object.fromEntries(
        Object.entries(changes).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(defined).length === 0) {
        return;
      }
      patchState(store, {
        summaries: store
          .summaries()
          .map((s) => (s.id === id ? { ...s, ...defined } : s)),
      });
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
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)), { lastSaveErrors: [] });
                loadSummaries();
                if (!silent) {
                  messages.add({
                    severity: 'success',
                    summary: 'Gespeichert',
                    detail: 'Die Tour wurde erfolgreich gespeichert.',
                  });
                }
              } else {
                patchState(store, { lastSaveErrors: errors });
                messages.add({
                  severity: 'error',
                  summary: 'Speichern fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveError(e)).join(', ')}`
                    : 'Bitte erneut versuchen oder die Seite neu laden.',
                  life: 10000,
                });
              }
            }),
          ),
        ),
      ),
    );

    const addPreliminary = rxMethod<Tour>(
      pipe(
        switchMap((tour) => {
          const body = buildSaveBody(tour, (events) => {
            events.preliminary = { startDate: events.tourEvent.startDate } as Event;
          });
          return tourService.upsertTour(tour.id, body).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)), { lastSaveErrors: [] });
              } else {
                patchState(store, { lastSaveErrors: errors });
                messages.add({
                  severity: 'error',
                  summary: 'Vorbesprechung hinzufügen fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveError(e)).join(', ')}`
                    : 'Bitte erneut versuchen oder die Seite neu laden.',
                  life: 10000,
                });
              }
            }),
          );
        }),
      ),
    );

    /**
     * Marks the preliminary event deprecated instead of deleting the row, so a
     * later re-add reuses the same server-side event (see addPreliminary).
     */
    const removePreliminary = rxMethod<Tour>(
      pipe(
        switchMap((tour) => {
          const body = buildSaveBody(tour, (events) => {
            if (events.preliminary) {
              events.preliminary = { ...events.preliminary, deprecated: true };
            }
          });
          return tourService.upsertTour(tour.id, body).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)), { lastSaveErrors: [] });
              } else {
                patchState(store, { lastSaveErrors: errors });
                messages.add({
                  severity: 'error',
                  summary: 'Vorbesprechung entfernen fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveError(e)).join(', ')}`
                    : 'Bitte erneut versuchen oder die Seite neu laden.',
                  life: 10000,
                });
              }
            }),
          );
        }),
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
        syncSummary(id, {
          guideId: changes.guideId,
          ladiesOnly: changes.ladiesOnly,
          youthOnTour: changes.youthOnTour,
          minQuantity: changes.minQuantity,
          maxQuantity: changes.maxQuantity,
          curQuantity: changes.curQuantity,
          stateId: changes.stateId,
        } as Partial<TourSummary>);
      },
      updateEventLocal(id: number, changes: Partial<Event>): void {
        eventsStore.updateEvent(id, changes);
        // Only the main tour event feeds the summary (title/date columns).
        const tour = store.entities().find((t) => t.tourId === id);
        if (tour) {
          syncSummary(tour.id, {
            title: changes.title,
            startDate: changes.startDate,
            endDate: changes.endDate,
          } as Partial<TourSummary>);
        }
      },
      create,
      cloneById,
      remove,
      save,
      addPreliminary,
      removePreliminary,
    };
  }),
);
