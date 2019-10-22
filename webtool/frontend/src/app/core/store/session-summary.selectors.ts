import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State, selectAll} from './session-summary.reducer';

export const getTourSummaryState = createFeatureSelector<State>('sessionSummaries');
export const getTourSummaries = createSelector(getTourSummaryState, selectAll);
