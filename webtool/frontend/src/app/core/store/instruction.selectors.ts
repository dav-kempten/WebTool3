import {createFeatureSelector, createSelector} from "@ngrx/store";
import {State as InstructionState} from "./instruction.reducer";

export const selectInstructionsState = createFeatureSelector<InstructionState>("instructions");

export const selectInstructionById = (instructionId: number) => createSelector(
  selectInstructionsState,
  instructionState => instructionState.entities[instructionId]
);

export const getInstructionIsLoading = createSelector(selectInstructionsState,(state: InstructionState) => state.isLoading);

