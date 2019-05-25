import { Action } from '@ngrx/store';
import { State } from '../../model/value';

export enum StateActionTypes {
  AddStates = '[State] Add States',
  ClearStates = '[State] Clear States'
}

export class AddStates implements Action {
  readonly type = StateActionTypes.AddStates;

  constructor(public payload: { states: State[] }) {}
}

export class ClearStates implements Action {
  readonly type = StateActionTypes.ClearStates;
}

export type StateActions = AddStates | ClearStates;
