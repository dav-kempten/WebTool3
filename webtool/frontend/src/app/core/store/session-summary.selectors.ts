import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State, selectAll} from './session-summary.reducer';

export const getSessionSummaryState = createFeatureSelector<State>('sessionSummaries');
export const getSessionSummaries = createSelector(getSessionSummaryState, selectAll);
