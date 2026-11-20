import { inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { withEntities, setEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { GuideService } from '../services/guide.service';
import { Guide, GuideProfile, GuideSummary } from '../../models/guide';
import { SaveError, describeSaveErrors } from '../../shared/util/save-error';

interface GuidesState {
  summaries: GuideSummary[];
  summariesLoaded: boolean;
  notFoundIds: Record<number, boolean>;
  lastSaveErrors: SaveError[];
}

const initial: GuidesState = {
  summaries: [],
  summariesLoaded: false,
  notFoundIds: {},
  lastSaveErrors: [],
};

export const GuidesStore = signalStore(
  { providedIn: 'root' },
  withState<GuidesState>(initial),
  withEntities<Guide>(),
  withComputed((store) => ({
    guideById: store.entityMap,
  })),
  withMethods((store) => {
    const service = inject(GuideService);
    const messages = inject(MessageService);

    const loadSummaries = rxMethod<void>(
      pipe(
        switchMap(() =>
          service.getGuideSummaries().pipe(
            tap((summaries) =>
              patchState(store, { summaries, summariesLoaded: true }),
            ),
          ),
        ),
      ),
    );

    const loadGuide = rxMethod<number>(
      pipe(
        switchMap((id) =>
          service.getGuide(id).pipe(
            tap((guide) => {
              if (guide) {
                const { [id]: _, ...restMissing } = store.notFoundIds();
                patchState(store, setEntity(guide), { notFoundIds: restMissing });
              } else {
                patchState(store, {
                  notFoundIds: { ...store.notFoundIds(), [id]: true },
                });
              }
            }),
          ),
        ),
      ),
    );

    const save = rxMethod<{ id: number; profile: GuideProfile; silent?: boolean }>(
      pipe(
        switchMap(({ id, profile, silent }) =>
          service.updateGuide(id, profile).pipe(
            tap(({ data, errors }) => {
              if (data) {
                const hasProfile = Object.values(data.profile).some(
                  (v) => typeof v === 'string' && v.trim().length > 0,
                );
                patchState(store, setEntity(data), {
                  lastSaveErrors: [],
                  summaries: store.summaries().map((s) =>
                    s.id === data.id
                      ? { ...s, job: data.profile.job ?? '', hasProfile }
                      : s,
                  ),
                });
                if (!silent) {
                  messages.add({
                    severity: 'success',
                    summary: 'Gespeichert',
                    detail: 'Der Steckbrief wurde gespeichert.',
                  });
                }
              } else {
                patchState(store, { lastSaveErrors: errors });
                messages.add({
                  severity: 'error',
                  summary: 'Speichern fehlgeschlagen',
                  detail: describeSaveErrors(
                    errors,
                    'Bitte erneut versuchen oder die Seite neu laden.',
                  ),
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
      loadGuide,
      save,
      clearSaveErrors(): void {
        patchState(store, { lastSaveErrors: [] });
      },
    };
  }),
);