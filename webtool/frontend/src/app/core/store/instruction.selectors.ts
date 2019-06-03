import {createFeatureSelector, createSelector} from "@ngrx/store";
import {adapter, State as InstructionState} from "./instruction.reducer";
import {Instruction} from "./instruction.model";
import {Dictionary, EntityState} from "@ngrx/entity";

export const selectInstructionsState = createFeatureSelector<InstructionState>('instructions');

export const selectInstructionById = (instructionId: number) => createSelector(
  selectInstructionsState,
  (instructionState: EntityState<Instruction>)=> instructionState.entities[instructionId]);

export const getInstructionEntities = createSelector(selectInstructionById, (state: Dictionary<any>) : Instruction => state.entities);
export const getInstructionIsLoading = createSelector(selectInstructionsState, (state: InstructionState) => state.isLoading);
export const getInstructionTimestamp = createSelector(selectInstructionsState, (state: InstructionState) => state.timestamp);

/* export const = createSelector(selectInstructionsById, (instruction: Instruction) :  => instruction.); */

export const getInstructionId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.id
);

export const getInstructionGuideId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.guideId
);

export const getInstructionTeamIds = createSelector(
  getInstructionEntities,
  (instruction: Instruction) : number[] => instruction.teamIds
);

export const getInstructionTopicId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.topicId
);

export const getInstructionEventId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.instructionId
);

export const getInstructionMeetingIds = createSelector(
  getInstructionEntities,
  (instruction: Instruction) : number[] => instruction.meetingIds
);

export const getInstructionLowEmissionBool = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.lowEmissionAdventure
);

export const getInstructionLadiesOnlyBool = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.ladiesOnly
);

export const getInstructionIsSpecialBool = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.isSpecial
);

export const getInstructionCategoryId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.categoryId
);

export const getInstructionQualificationIds = createSelector(
  getInstructionEntities,
  (instruction: Instruction) : number[] => instruction.qualificationIds
);

export const getInstructionPreconditions = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.preconditions
);

export const getInstructionEquipmentIds = createSelector(
  getInstructionEntities,
  (instruction: Instruction) : number[] => instruction.equipmentIds
);

export const getInstructionMiscEquipment = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.miscEquipment
);

export const getInstructionEquipmentServiceBool = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.equipmentService
);

export const getInstructionAdmission = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.admission
);

export const getInstructionAdvances = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.advances
);

export const getInstructionAdvancesInfo = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.advancesInfo
);

export const getInstructionExtraCharges = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.extraCharges
);

export const getInstructionExtraChargesInfo = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.extraChargesInfo
);

export const getInstructionMinQuantity = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.minQuantity
);

export const getInstructionMaxQuantity = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.maxQuantity
);

export const getInstructionCurQuantity = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.curQuantity
);

export const getInstructionStateId = createSelector(
  getInstructionEntities,
  (instruction: Instruction) => instruction.stateId
);

export const {
    selectIds,
    selectEntities,
    selectAll,
    selectTotal,
  } = adapter.getSelectors(selectInstructionsState);
