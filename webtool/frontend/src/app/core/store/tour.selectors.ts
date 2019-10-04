import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './tour.reducer';

export const getTourState = createFeatureSelector<State>('tours');

export const getTourById = (tourId: number) => createSelector(
  getTourState, tourState => tourState.entities[tourId]
);

export const getTourIsLoading = createSelector(getTourState, (state: State) => state.isLoading);
