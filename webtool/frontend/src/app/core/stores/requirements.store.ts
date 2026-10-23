import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { RequirementService } from '../services/requirement.service';
import { RequirementOverview, RequirementSection } from '../../models/requirement';

interface RequirementsState {
  overview: RequirementOverview | null;
  loaded: boolean;
  loading: boolean;
  failed: boolean;
}

const initial: RequirementsState = {
  overview: null,
  loaded: false,
  loading: false,
  failed: false,
};

export const RequirementsStore = signalStore(
  { providedIn: 'root' },
  withState<RequirementsState>(initial),
  withComputed((store) => ({
    season: computed<string>(() => store.overview()?.season ?? ''),
    periodStart: computed<string>(() => store.overview()?.periodStart ?? ''),
    periodEnd: computed<string>(() => store.overview()?.periodEnd ?? ''),
    sections: computed<RequirementSection[]>(() => store.overview()?.sections ?? []),
  })),
  withMethods((store, service = inject(RequirementService)) => {
    /**
     * Always refetches. The panel is a live view of what is entered right now,
     * so a cached bundle would be exactly the wrong thing — but a request
     * already in flight is not duplicated.
     */
    const load = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          service.getOverview().pipe(
            tap((overview) =>
              patchState(store, {
                overview: overview ?? store.overview(),
                loaded: !!overview || store.loaded(),
                loading: false,
                failed: !overview,
              }),
            ),
            catchError(() => {
              patchState(store, { loading: false, failed: true });
              return of(null);
            }),
          ),
        ),
      ),
    );

    return {
      load,
      /** Loads once; later calls are no-ops until `load` is asked for again. */
      ensureOverview(): void {
        if (!store.loaded() && !store.loading()) {
          load();
        }
      },
      reset(): void {
        patchState(store, initial);
      },
    };
  }),
);
