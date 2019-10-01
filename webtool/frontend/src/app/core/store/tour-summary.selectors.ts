import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State, selectAll} from './tour-summary.reducer';

export const getTourSummaryState = createFeatureSelector<State>('tourSummaries');
export const getTourSummaries = createSelector(getTourSummaryState, selectAll);
