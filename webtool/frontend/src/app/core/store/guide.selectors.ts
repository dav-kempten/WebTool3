import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './guide.reducer';

export const getGuideState = createFeatureSelector<State>('guides');

export const getGuideById = (guideId: number) => createSelector(
  getGuideState, guideState => guideState.entities[guideId]
);

export const getGuideIsLoading = createSelector(getGuideState, (state: State) => state.isLoading);
