import {Action} from '@ngrx/store';
import {Approximate} from '../../model/value';

export enum ApproximateActionTypes {
  AddApproximates = '[Approximate] Add Approximates',
  ClearApproximates = '[Approximate] Clear Approximates'
}

export class AddApproximates implements Action {
  readonly type = ApproximateActionTypes.AddApproximates;

  constructor(public payload: { approximates: Approximate[] }) {}
}

export class ClearApproximates implements Action {
  readonly type = ApproximateActionTypes.ClearApproximates;
}

export type ApproximateActions = AddApproximates | ClearApproximates;
