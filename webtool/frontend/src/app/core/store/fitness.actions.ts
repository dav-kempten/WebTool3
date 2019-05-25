import {Action} from '@ngrx/store';
import {Fitness} from '../../model/value';

export enum FitnessActionTypes {
  AddFitness = '[Fitness] Add Fitness',
  ClearFitness = '[Fitness] Clear Fitness'
}

export class AddFitness implements Action {
  readonly type = FitnessActionTypes.AddFitness;

  constructor(public payload: { fitness: Fitness[] }) {}
}

export class ClearFitness implements Action {
  readonly type = FitnessActionTypes.ClearFitness;
}

export type FitnessActions = AddFitness | ClearFitness;
