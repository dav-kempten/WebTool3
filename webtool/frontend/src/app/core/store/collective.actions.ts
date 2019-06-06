import {Action} from '@ngrx/store';
import {Collective} from '../../model/value';

export enum CollectiveActionTypes {
  AddCollectives = '[Collective] Add Collectives',
  ClearCollectives = '[Collective] Clear Collectives'
}

export class AddCollectives implements Action {
  readonly type = CollectiveActionTypes.AddCollectives;

  constructor(public payload: { collectives: Collective[] }) {}
}

export class ClearCollectives implements Action {
  readonly type = CollectiveActionTypes.ClearCollectives;
}

export type CollectiveActions = AddCollectives | ClearCollectives;
