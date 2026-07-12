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
import { GuideService } from '../services/guide.service';
import { Guide, GuideSummary } from '../../models/guide';

interface GuidesState {
  summaries: GuideSummary[];
  summariesLoaded: boolean;
}

const initial: GuidesState = { summaries: [], summariesLoaded: false };

export const GuidesStore = signalStore(
  { providedIn: 'root' },
  withState<GuidesState>(initial),
  withEntities<Guide>(),
  withComputed((store) => ({
    guideById: store.entityMap,
  })),
  withMethods((store) => {
    const service = inject(GuideService);

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
                patchState(store, setEntity(guide));
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
    };
  }),
);