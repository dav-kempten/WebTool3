import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './retraining.reducer';

export const getRetrainingState = createFeatureSelector<State>('retrainings');

export const getRetrainingById = (retrainingId: number) => createSelector(
  getRetrainingState, retrainingState => retrainingState.entities[retrainingId]
);

export const getRetrainingByIds = (retrainingIds: number[]) => createSelector(
  getRetrainingState, retrainingState => Object.values(retrainingState.entities)
      .filter(retraining => retrainingIds.includes(retraining.id))
);
