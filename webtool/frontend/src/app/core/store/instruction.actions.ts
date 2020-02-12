import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Instruction } from './instruction.model';

export enum InstructionActionTypes {
  InstructionNotModified = '[Instruction] Instruction not modified',
  InstructionDeleteComplete = '[Instruction] Instruction delete complete',
  InstructionDeactivateComplete = '[Instruction] Instruction deactivate complete',
  InstructionCreateComplete = '[Instruction] Instruction create complete',
  InstructionUpdateComplete = '[Instruction] Instruction update complete',
  RequestInstruction = '[Instruction] Request Instruction',
  LoadInstructions = '[Instruction] Load Instructions',
  AddInstruction = '[Instruction] Add Instruction',
  UpsertInstruction = '[Instruction] Upsert Instruction',
  AddEventInstruction = '[Instruction] AddEvent Instruction',
  DeleteEventInstruction = '[Instruction] DeleteEvent Instruction',
  AddInstructions = '[Instruction] Add Instructions',
  UpsertInstructions = '[Instruction] Upsert Instructions',
  UpdateInstruction = '[Instruction] Update Instruction',
  UpdateInstructions = '[Instruction] Update Instructions',
  DeleteInstruction = '[Instruction] Delete Instruction',
  DeleteInstructions = '[Instruction] Delete Instructions',
  ClearInstructions = '[Instruction] Clear Instructions',
  CreateInstruction = '[Instruction] Create Instruction',
  CloneInstruction = '[Instruction] Clone Instruction',
  DeactivateInstruction = '[Instruction] Deactivate Instruction',
}

export class RequestInstruction implements Action {
  readonly type = InstructionActionTypes.RequestInstruction;

  constructor(public payload: { id: number }) {}
}

export class InstructionNotModified implements Action {
  readonly type = InstructionActionTypes.InstructionNotModified;
}

export class InstructionDeleteComplete implements Action {
  readonly type = InstructionActionTypes.InstructionDeleteComplete;
}

export class InstructionDeactivateComplete implements Action {
  readonly type = InstructionActionTypes.InstructionDeactivateComplete;
}

export class InstructionCreateComplete implements Action {
  readonly type = InstructionActionTypes.InstructionCreateComplete;
}

export class InstructionUpdateComplete implements Action {
  readonly type = InstructionActionTypes.InstructionUpdateComplete;
}

export class LoadInstructions implements Action {
  readonly type = InstructionActionTypes.LoadInstructions;

  constructor(public payload: { instructions: Instruction[] }) {}
}

export class AddInstruction implements Action {
  readonly type = InstructionActionTypes.AddInstruction;

  constructor(public payload: { instruction: Instruction }) {}
}

export class UpsertInstruction implements Action {
  readonly type = InstructionActionTypes.UpsertInstruction;

  constructor(public payload: { instruction: Instruction }) {}
}

export class AddEventInstruction implements Action {
  readonly type = InstructionActionTypes.AddEventInstruction;

  constructor(public payload: { instruction: Instruction }) {}
}

export class DeleteEventInstruction implements Action {
  readonly type = InstructionActionTypes.DeleteEventInstruction;

  constructor(public payload: { instruction: Instruction, eventId: number }) {}
}

export class AddInstructions implements Action {
  readonly type = InstructionActionTypes.AddInstructions;

  constructor(public payload: { instructions: Instruction[] }) {}
}

export class UpsertInstructions implements Action {
  readonly type = InstructionActionTypes.UpsertInstructions;

  constructor(public payload: { instructions: Instruction[] }) {}
}

export class UpdateInstruction implements Action {
  readonly type = InstructionActionTypes.UpdateInstruction;

  constructor(public payload: { instruction: Update<Instruction> }) {}
}

export class UpdateInstructions implements Action {
  readonly type = InstructionActionTypes.UpdateInstructions;

  constructor(public payload: { instructions: Update<Instruction>[] }) {}
}

export class DeleteInstruction implements Action {
  readonly type = InstructionActionTypes.DeleteInstruction;

  constructor(public payload: { id: number }) {}
}

export class DeleteInstructions implements Action {
  readonly type = InstructionActionTypes.DeleteInstructions;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearInstructions implements Action {
  readonly type = InstructionActionTypes.ClearInstructions;
}

export class CreateInstruction implements Action {
  readonly type = InstructionActionTypes.CreateInstruction;

  constructor(public payload: { topicId: number, startDate: string}) {}
}

export class CloneInstruction implements Action {
  readonly type = InstructionActionTypes.CloneInstruction;

  constructor(public payload: { id: number }) {}
}

export class DeactivateInstruction implements Action {
  readonly type = InstructionActionTypes.DeactivateInstruction;

  constructor(public payload: { id: number }) {}
}

export type InstructionActions =
  RequestInstruction
  | InstructionNotModified
  | InstructionDeleteComplete
  | InstructionDeactivateComplete
  | InstructionCreateComplete
  | InstructionUpdateComplete
  | LoadInstructions
  | AddInstruction
  | UpsertInstruction
  | AddEventInstruction
  | DeleteEventInstruction
  | AddInstructions
  | UpsertInstructions
  | UpdateInstruction
  | UpdateInstructions
  | DeleteInstruction
  | DeleteInstructions
  | ClearInstructions
  | CreateInstruction
  | CloneInstruction
  | DeactivateInstruction;
