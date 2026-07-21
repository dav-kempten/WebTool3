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
import {
  InstructionService,
  CreateInstructionPayload,
} from '../services/instruction.service';
import { EventsStore } from './events.store';
import { ValuesStore } from './values.store';
import {
  Instruction,
  InstructionSummary,
  RawInstruction,
} from '../../models/instruction';
import { Event } from '../../models/event';
import { SaveError, describeSaveErrorPath } from '../../shared/util/save-error';

interface InstructionsState {
  summaries: InstructionSummary[];
  summariesLoaded: boolean;
  lastSaveErrors: SaveError[];
}

const initial: InstructionsState = {
  summaries: [],
  summariesLoaded: false,
  lastSaveErrors: [],
};

const toNumber = (v: string | number | null | undefined) => Number(v ?? 0);

export const InstructionsStore = signalStore(
  { providedIn: 'root' },
  withState<InstructionsState>(initial),
  withEntities<Instruction>(),
  withComputed((store) => ({
    instructionById: store.entityMap,
  })),
  withMethods((store) => {
    const service = inject(InstructionService);
    const eventsStore = inject(EventsStore);
    const valuesStore = inject(ValuesStore);
    const router = inject(Router);
    const messages = inject(MessageService);

    function rawToEntity(raw: RawInstruction): Instruction {
      const events: Event[] = [raw.instruction, ...raw.meetings];
      eventsStore.addEvents(events);

      const { instruction, meetings, admission, advances, extraCharges, ...rest } =
        raw as RawInstruction & Record<string, unknown>;

      return {
        ...(rest as Omit<
          Instruction,
          'instructionId' | 'meetingIds' | 'admission' | 'advances' | 'extraCharges'
        >),
        instructionId: raw.instruction.id,
        meetingIds: raw.meetings.map((m) => m.id),
        admission: toNumber(admission),
        advances: toNumber(advances),
        extraCharges: toNumber(extraCharges),
      };
    }

    function buildSaveBody(
      instruction: Instruction,
      mutate?: (events: { main: Event; meetings: Event[] }) => void,
    ): unknown {
      const events = eventsStore
        .eventsByIds([instruction.instructionId, ...instruction.meetingIds])
        .map((event) => ({ ...event }));
      const main = events[0];
      const meetings = events.slice(1);
      meetings.forEach((m) => (m.distance = 0));

      if (mutate) {
        mutate({ main, meetings });
      }

      return {
        ...instruction,
        instruction: main,
        meetings,
        admission: String(instruction.admission ?? 0),
        advances: String(instruction.advances ?? 0),
        extraCharges: String(instruction.extraCharges ?? 0),
      };
    }

    function buildCloneBody(
      raw: RawInstruction,
      startDate: string,
      endDate: string | null,
    ): unknown {
      const main = { ...raw.instruction, startDate, endDate: endDate || null };
      delete (main as Record<string, unknown>)['id'];
      const meetings = raw.meetings.map((m) => {
        const copy = { ...m } as Record<string, unknown>;
        delete copy['id'];
        return copy;
      });
      const flat = { ...raw } as Record<string, unknown>;
      delete flat['instruction'];
      delete flat['meetings'];
      delete flat['id'];
      delete flat['reference'];
      flat['stateId'] = 1;
      flat['curQuantity'] = 0;

      return {
        ...flat,
        instruction: main,
        meetings,
        admission: String(raw.admission ?? 0),
        advances: String(raw.advances ?? 0),
        extraCharges: String(raw.extraCharges ?? 0),
      };
    }

    /**
     * Mirrors the summary-visible subset of a local edit into the list row,
     * so the list views update immediately instead of after the next save.
     */
    function syncSummary(id: number, changes: Partial<InstructionSummary>): void {
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
          service.getInstructionSummaries().pipe(
            tap((summaries) =>
              patchState(store, { summaries, summariesLoaded: true }),
            ),
          ),
        ),
      ),
    );

    const loadInstruction = rxMethod<number>(
      pipe(
        switchMap((id) =>
          service.getInstruction(id).pipe(
            tap((raw) => {
              if (raw) {
                patchState(store, setEntity(rawToEntity(raw)));
              }
            }),
          ),
        ),
      ),
    );

    const create = rxMethod<CreateInstructionPayload>(
      pipe(
        switchMap((payload) =>
          service.createInstruction(payload).pipe(
            tap((created) => {
              if (created.id !== 0) {
                loadSummaries();
                void router.navigate(['instructions', created.id]);
              } else {
                messages.add({
                  severity: 'error',
                  summary: 'Kurserstellung fehlgeschlagen',
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
          service.getInstruction(id).pipe(
            switchMap((raw) => {
              if (!raw) {
                return EMPTY;
              }
              return service.cloneInstruction(buildCloneBody(raw, startDate, endDate)).pipe(
                tap((created) => {
                  if (created.id !== 0) {
                    loadSummaries();
                    void router.navigate(['instructions', created.id]);
                  } else {
                    messages.add({
                      severity: 'error',
                      summary: 'Klonen fehlgeschlagen',
                      detail: 'Der Kurs konnte nicht kopiert werden.',
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
          service.deleteInstruction(id).pipe(
            tap((ok) => {
              if (ok) {
                patchState(store, removeEntity(id));
                loadSummaries();
                void router.navigate(['instructions']);
              }
            }),
          ),
        ),
      ),
    );

    const save = rxMethod<{ instruction: Instruction; silent?: boolean }>(
      pipe(
        switchMap(({ instruction, silent }) =>
          service.upsertInstruction(instruction.id, buildSaveBody(instruction)).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)), { lastSaveErrors: [] });
                loadSummaries();
                if (!silent) {
                  messages.add({
                    severity: 'success',
                    summary: 'Gespeichert',
                    detail: 'Der Kurs wurde erfolgreich gespeichert.',
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

    const addMeeting = rxMethod<{ instruction: Instruction; isIndoor: boolean }>(
      pipe(
        switchMap(({ instruction, isIndoor }) => {
          const body = buildSaveBody(instruction, ({ main, meetings }) => {
            meetings.push(
              isIndoor
                ? ({
                    id: null,
                    startDate: main.startDate,
                    startTime: main.startTime,
                    endTime: main.endTime,
                  } as unknown as Event)
                : ({ id: null, startDate: main.startDate } as unknown as Event),
            );
          });
          return service.upsertInstruction(instruction.id, body).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)));
              } else {
                messages.add({
                  severity: 'error',
                  summary: 'Kurstermin hinzufügen fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveErrorPath(e.path)).join(', ')}`
                    : 'Bitte erneut versuchen oder die Seite neu laden.',
                  life: 10000,
                });
              }
            }),
          );
        }),
      ),
    );

    const removeMeeting = rxMethod<{ instruction: Instruction; eventId: number }>(
      pipe(
        switchMap(({ instruction, eventId }) => {
          const body = buildSaveBody(instruction, ({ meetings }) => {
            const idx = meetings.findIndex((m) => m.id === eventId);
            if (idx > -1) {
              meetings[idx] = { ...meetings[idx], deprecated: true };
            }
          });
          return service.upsertInstruction(instruction.id, body).pipe(
            tap(({ data, errors }) => {
              if (data) {
                patchState(store, setEntity(rawToEntity(data)));
              } else {
                messages.add({
                  severity: 'error',
                  summary: 'Kurstermin entfernen fehlgeschlagen',
                  detail: errors.length
                    ? `Fehlerhafte Felder: ${errors.map((e) => describeSaveErrorPath(e.path)).join(', ')}`
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
      loadInstruction,
      updateLocal(id: number, changes: Partial<Instruction>): void {
        patchState(store, updateEntity({ id, changes }));
        // List title mirrors the backend rule: special courses are titled
        // after their main event, regular ones after the topic.
        const entity = store.entityMap()[id];
        let title: string | undefined;
        if (entity && changes.isSpecial !== undefined) {
          title = changes.isSpecial
            ? (eventsStore.entityMap()[entity.instructionId]?.title ?? '')
            : (valuesStore.topicById().get(entity.topicId)?.name ?? '');
        }
        syncSummary(id, {
          title,
          guideId: changes.guideId,
          ladiesOnly: changes.ladiesOnly,
          minQuantity: changes.minQuantity,
          maxQuantity: changes.maxQuantity,
          curQuantity: changes.curQuantity,
          stateId: changes.stateId,
        } as Partial<InstructionSummary>);
      },
      updateEventLocal(id: number, changes: Partial<Event>): void {
        eventsStore.updateEvent(id, changes);
        // Only the main course event feeds the summary; its title counts only
        // for special courses (regular ones are titled after the topic).
        const instruction = store.entities().find((i) => i.instructionId === id);
        if (instruction) {
          syncSummary(instruction.id, {
            title: instruction.isSpecial ? changes.title : undefined,
            startDate: changes.startDate,
            endDate: changes.endDate,
          } as Partial<InstructionSummary>);
        }
      },
      create,
      cloneById,
      remove,
      save,
      addMeeting,
      removeMeeting,
    };
  }),
);