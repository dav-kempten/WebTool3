import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { InstructionSummary } from './instruction-summary.model';

export enum InstructionSummaryActionTypes {
  InstructionSummariesNotModified = '[InstructionSummary] InstructionSummaries not modified',
  RequestInstructionSummaries = '[InstructionSummary] Request InstructionSummaries',
  LoadInstructionSummaries = '[InstructionSummary] Load InstructionSummaries',
  AddInstructionSummary = '[InstructionSummary] Add InstructionSummary',
  UpsertInstructionSummary = '[InstructionSummary] Upsert InstructionSummary',
  AddInstructionSummaries = '[InstructionSummary] Add InstructionSummaries',
  UpsertInstructionSummaries = '[InstructionSummary] Upsert InstructionSummaries',
  UpdateInstructionSummary = '[InstructionSummary] Update InstructionSummary',
  UpdateInstructionSummaries = '[InstructionSummary] Update InstructionSummaries',
  DeleteInstructionSummary = '[InstructionSummary] Delete InstructionSummary',
  DeleteInstructionSummaries = '[InstructionSummary] Delete InstructionSummaries',
  ClearInstructionSummaries = '[InstructionSummary] Clear InstructionSummaries'
}

export class RequestInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.RequestInstructionSummaries;
}

export class InstructionSummariesNotModified implements Action {
  readonly type = InstructionSummaryActionTypes.InstructionSummariesNotModified;
}

export class LoadInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.LoadInstructionSummaries;

  constructor(public payload: { instructionSummaries: InstructionSummary[] }) {}
}

export class AddInstructionSummary implements Action {
  readonly type = InstructionSummaryActionTypes.AddInstructionSummary;

  constructor(public payload: { instructionSummary: InstructionSummary }) {}
}

export class UpsertInstructionSummary implements Action {
  readonly type = InstructionSummaryActionTypes.UpsertInstructionSummary;

  constructor(public payload: { instructionSummary: InstructionSummary }) {}
}

export class AddInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.AddInstructionSummaries;

  constructor(public payload: { instructionSummaries: InstructionSummary[] }) {}
}

export class UpsertInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.UpsertInstructionSummaries;

  constructor(public payload: { instructionSummaries: InstructionSummary[] }) {}
}

export class UpdateInstructionSummary implements Action {
  readonly type = InstructionSummaryActionTypes.UpdateInstructionSummary;

  constructor(public payload: { instructionSummary: Update<InstructionSummary> }) {}
}

export class UpdateInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.UpdateInstructionSummaries;

  constructor(public payload: { instructionSummaries: Update<InstructionSummary>[] }) {}
}

export class DeleteInstructionSummary implements Action {
  readonly type = InstructionSummaryActionTypes.DeleteInstructionSummary;

  constructor(public payload: { id: number }) {}
}

export class DeleteInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.DeleteInstructionSummaries;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearInstructionSummaries implements Action {
  readonly type = InstructionSummaryActionTypes.ClearInstructionSummaries;
}

export type InstructionSummaryActions =
  RequestInstructionSummaries
  | InstructionSummariesNotModified
  | LoadInstructionSummaries
  | AddInstructionSummary
  | UpsertInstructionSummary
  | AddInstructionSummaries
  | UpsertInstructionSummaries
  | UpdateInstructionSummary
  | UpdateInstructionSummaries
  | DeleteInstructionSummary
  | DeleteInstructionSummaries
  | ClearInstructionSummaries;
