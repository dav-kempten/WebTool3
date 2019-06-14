import {createFeatureSelector, createSelector} from '@ngrx/store';
import {selectAll, State} from './name.reducer';

export const getNamesState = createFeatureSelector<State>('names');

export const getNamesIsLoading = createSelector(getNamesState, (state: State) => state.isLoading);

export const getNameById = (nameId: number) => createSelector(
  getNamesState,
    state => state.entities[nameId]
);

export const getNames = createSelector(
  getNamesState,
  selectAll
);
