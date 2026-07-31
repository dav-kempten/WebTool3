import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, filter } from 'rxjs';
import { NameService } from '../services/name.service';
import { Name } from '../../models/name';

interface NamesState {
  names: Name[];
  loaded: boolean;
  loading: boolean;
}

const initial: NamesState = { names: [], loaded: false, loading: false };

export const NamesStore = signalStore(
  { providedIn: 'root' },
  withState<NamesState>(initial),
  withComputed((store) => ({
    nameById: computed(() => new Map(store.names().map((n) => [n.id, n]))),
  })),
  withMethods((store, nameService = inject(NameService)) => ({
    loadNames: rxMethod<void>(
      pipe(
        filter(() => !store.loaded() && !store.loading()),
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          nameService.getNames().pipe(
            tap((names) =>
              patchState(store, { names, loaded: true, loading: false }),
            ),
          ),
        ),
      ),
    ),
    displayName(id: number | null | undefined): string {
      if (id == null) {
        return '';
      }
      const name = store.nameById().get(id);
      return name ? `${name.firstName} ${name.lastName}` : '';
    },
  })),
);
