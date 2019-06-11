import {createFeatureSelector, createSelector} from "@ngrx/store";
import {State, selectAll} from "./instruction.reducer";
import {Instruction} from "./instruction.model";
import {Dictionary, EntityState} from "@ngrx/entity";

export const getInstructionState = createFeatureSelector<State>('instructions');

export const getInstructionById = (instructionId: number) => createSelector(
  getInstructionState, instructionState => instructionState.entities[instructionId]
);

export const getInstructionIsLoading = createSelector(getInstructionState, (state: State) => state.isLoading);
export const getInstructionTimestamp = createSelector(getInstructionState, (state: State) => state.timestamp);
