import {createFeatureSelector, createSelector} from '@ngrx/store';
import {selectAll, State} from './guide-summary.reducer';

export const getGuideSummaryState = createFeatureSelector<State>('guideSummaries');
export const getGuideSummaries = createSelector(getGuideSummaryState, selectAll);
