import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State, selectAll} from './instruction-summary.reducer';

export const getInstructionSummaryState = createFeatureSelector<State>('instructionSummaries');
export const getInstructionSummaries = createSelector(getInstructionSummaryState, selectAll);
