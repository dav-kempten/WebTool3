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
import { SessionService, CreateSessionPayload } from '../services/session.service';
import { EventsStore } from './events.store';
import { Session, SessionSummary, RawSession } from '../../models/session';
import { Event } from '../../models/event';
import { SaveError, describeSaveErrorPath } from '../../shared/util/save-error';

interface SessionsState {
  summaries: SessionSummary[];
  summariesLoaded: boolean;
  lastSaveErrors: SaveError[];
}

const initial: SessionsState = { summaries: [], summariesLoaded: false, lastSaveErrors: [] };

export const SessionsStore = signalStore(
  { providedIn: 'root' },
  withState<SessionsState>(initial),
  withEntities<Session>(),
  withComputed((store) => ({
    sessionById: store.entityMap,
  })),
  withMethods((store) => {
    const service = inject(SessionService);
    const eventsStore = inject(EventsStore);
    const router = inject(Router);
    const messages = inject(MessageService);

    function rawToEntity(raw: RawSession): Session {
      eventsStore.addEvent(raw.session);
      const { session, ...rest } = raw as RawSession & Record<string, unknown>;
      return {
        ...(rest as Omit<Session, 'sessionId'>),
        sessionId: raw.session.id,
      };
    }

    function buildSaveBody(session: Session): unknown {
      const [event] = eventsStore.eventsByIds([session.sessionId]);
      return { ...session, session: event };
    }

    function buildCloneBody(raw: RawSession): unknown {
      const session = { ...raw.session };
      delete (session as Record<string, unknown>)['id'];
      const flat = { ...raw } as Record<string, unknown>;
      delete flat['session'];
      delete flat['id'];
      delete flat['reference'];
      flat['stateId'] = 1;
      return { ...flat, session };
    }

    /**
     * Mirrors the summary-visible subset of a local edit into the list row,
     * so the list views update immediately instead of after the next save.
     */
    function syncSummary(id: number, changes: Partial<SessionSummary>): void {
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
          service.getSessionSummaries().pipe(
            tap((summaries) =>
              patchState(store, { summaries, summariesLoaded: true }),
            ),
          ),
        ),
      ),
    );

    const loadSession = rxMethod<number>(
      pipe(
        switchMap((id) =>
          service.getSession(id).pipe(
            tap((raw) => {
              if (raw) {
                patchState(store, setEntity(rawToEntity(raw)));
              }
            }),
          ),
        ),
      ),
    );

    const create = rxMethod<CreateSessionPayload>(
      pipe(
        switchMap((payload) =>
          service.createSession(payload).pipe(
            tap((created) => {
              if (created.id !== 0) {
                loadSummaries();
                void router.navigate(['sessions', created.id]);
              } else {
                messages.add({
                  severity: 'error',
                  summary: 'Erstellung fehlgeschlagen',
                  detail: 'Der Gruppentermin konnte nicht angelegt werden.',
                });
              }
            }),
          ),
        ),
      ),
    );

    const cloneById = rxMethod<number>(
      pipe(
        switchMap((id) =>
          service.getSession(id).pipe(
            switchMap((raw) => {
              if (!raw) {
                return EMPTY;
              }
              return service.cloneSession(buildCloneBody(raw)).pipe(
                tap((created) => {
                  if (created.id !== 0) {
                    loadSummaries();
                    void router.navigate(['sessions', created.id]);
                  } else {
                    messages.add({
                      severity: 'error',
                      summary: 'Klonen fehlgeschlagen',
                      detail: 'Der Gruppentermin konnte nicht kopiert werden.',
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
          service.deleteSession(id).pipe(
            tap((ok) => {
              if (ok) {
                patchState(store, removeEntity(id));
                loadSummaries();
                void router.navigate(['sessions']);
              }
            }),
          ),
        ),
      ),
    );

    const save = rxMethod<{ session: Session; silent?: boolean }>(
      pipe(
        switchMap(({ session, silent }) =>
          service.upsertSession(session.id, buildSaveBody(session)).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)), { lastSaveErrors: [] });
                loadSummaries();
                if (!silent) {
                  messages.add({
                    severity: 'success',
                    summary: 'Gespeichert',
                    detail: 'Der Gruppentermin wurde gespeichert.',
                  });
                }
              } else {
                patchState(store, { lastSaveErrors: errors });
                messages.add({
                  severity: 'error',
                  summary: 'Speichern fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveErrorPath(e.path)).join(', ')}`
                    : 'Bitte erneut versuchen oder die Seite neu laden.',
                  life: 10000,
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
      loadSession,
      updateLocal(id: number, changes: Partial<Session>): void {
        patchState(store, updateEntity({ id, changes }));
        syncSummary(id, {
          guideId: changes.guideId,
          speaker: changes.speaker,
          ladiesOnly: changes.ladiesOnly,
          stateId: changes.stateId,
        } as Partial<SessionSummary>);
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