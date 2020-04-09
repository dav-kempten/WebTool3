import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Retraining} from '../../model/retraining';

export enum RetrainingActionTypes {
  AddRetraining = '[Retraining] Add Retraining',
  UpsertRetraining = '[Retraining] Upsert Retraining',
  AddRetrainings = '[Retraining] Add Retrainings',
  UpsertRetrainings = '[Retraining] Upsert Retrainings',
  UpdateRetraining = '[Retraining] Update Retraining',
  UpdateRetrainings = '[Retraining] Update Retrainings',
  DeleteRetraining = '[Retraining] Delete Retraining',
  DeleteRetrainings = '[Retraining] Delete Retrainings',
  ClearRetrainings = '[Retraining] Clear Retrainings',
  CreateRetraining = '[Retraining] Create Retraining',
}

export class AddRetraining implements Action {
  readonly type = RetrainingActionTypes.AddRetraining;

  constructor(public payload: { retraining: Retraining }) {}
}

export class UpsertRetraining implements Action {
  readonly type = RetrainingActionTypes.UpsertRetraining;

  constructor(public payload: { retraining: Retraining }) {}
}

export class AddRetrainings implements Action {
  readonly type = RetrainingActionTypes.AddRetrainings;

  constructor(public payload: { retrainings: Retraining[] }) {}
}

export class UpsertRetrainings implements Action {
  readonly type = RetrainingActionTypes.UpsertRetrainings;

  constructor(public payload: { retrainings: Retraining[] }) {}
}

export class UpdateRetraining implements Action {
  readonly type = RetrainingActionTypes.UpdateRetraining;

  constructor(public payload: { retraining: Update<Retraining> }) {}
}

export class UpdateRetrainings implements Action {
  readonly type = RetrainingActionTypes.UpdateRetrainings;

  constructor(public payload: { retrainings: Update<Retraining>[] }) {}
}

export class DeleteRetraining implements Action {
  readonly type = RetrainingActionTypes.DeleteRetraining;

  constructor(public payload: { id: number }) {}
}

export class DeleteRetrainings implements Action {
  readonly type = RetrainingActionTypes.DeleteRetrainings;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearRetrainings implements Action {
  readonly type = RetrainingActionTypes.ClearRetrainings;
}

export class CreateRetraining implements Action {
  readonly type = RetrainingActionTypes.CreateRetraining;

  constructor(public payload: { id: number }) {}
}

export type RetrainingActions =
 AddRetraining
 | UpsertRetraining
 | AddRetrainings
 | UpsertRetrainings
 | UpdateRetraining
 | UpdateRetrainings
 | DeleteRetraining
 | DeleteRetrainings
 | ClearRetrainings
 | CreateRetraining;
