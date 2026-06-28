import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, filter, catchError, of } from 'rxjs';
import { ValueService } from '../services/value.service';
import {
  Approximate,
  Category,
  Collective,
  Equipment,
  Fitness,
  Skill,
  State,
  Topic,
  Values,
} from '../../models/value';

interface ValuesState {
  values: Values | null;
  loaded: boolean;
  loading: boolean;
}

const initial: ValuesState = { values: null, loaded: false, loading: false };

function byId<T extends { id: number }>(items: T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export const ValuesStore = signalStore(
  { providedIn: 'root' },
  withState<ValuesState>(initial),
  withComputed((store) => ({
    states: computed<State[]>(() => store.values()?.states ?? []),
    categories: computed<Category[]>(() => store.values()?.categories ?? []),
    approximates: computed<Approximate[]>(() => store.values()?.approximates ?? []),
    equipments: computed<Equipment[]>(() => store.values()?.equipments ?? []),
    skills: computed<Skill[]>(() => store.values()?.skills ?? []),
    fitness: computed<Fitness[]>(() => store.values()?.fitness ?? []),
    topics: computed<Topic[]>(() => store.values()?.topics ?? []),
    collectives: computed<Collective[]>(() => store.values()?.collectives ?? []),
  })),
  withComputed((store) => ({
    stateById: computed(() => byId(store.states())),
    categoryById: computed(() => byId(store.categories())),
    approximateById: computed(() => byId(store.approximates())),
    equipmentById: computed(() => byId(store.equipments())),
    skillById: computed(() => byId(store.skills())),
    fitnessById: computed(() => byId(store.fitness())),
    topicById: computed(() => byId(store.topics())),
    collectiveById: computed(() => byId(store.collectives())),
  })),
  withMethods((store, valueService = inject(ValueService)) => ({
    /** Loads the reference-data bundle once and caches it for the session. */
    loadValues: rxMethod<void>(
      pipe(
        filter(() => !store.loaded() && !store.loading()),
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          valueService.getValues().pipe(
            tap((values) =>
              patchState(store, {
                values: values ?? null,
                loaded: !!values,
                loading: false,
              }),
            ),
            catchError(() => {
              patchState(store, { loading: false });
              return of(null);
            }),
          ),
        ),
      ),
    ),
  })),
);
