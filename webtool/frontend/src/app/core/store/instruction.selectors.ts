import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './instruction.reducer';

export const getInstructionState = createFeatureSelector<State>('instructions');

export const getInstructionById = (instructionId: number) => createSelector(
  getInstructionState, instructionState => instructionState.entities[instructionId]
);

export const getInstructionIsLoading = createSelector(getInstructionState, (state: State) => state.isLoading);
