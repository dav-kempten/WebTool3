import {Action} from '@ngrx/store';
import {Name} from '../../model/name';

export enum NameActionTypes {
  NamesRequested = '[Name] Request NameState',
  AddNames = '[Name] Add Names',
  ClearNames = '[Name] Clear Names',
  NamesNotModified = '[Name] NameState not modified'
}

export class NamesRequested implements Action {
  readonly type = NameActionTypes.NamesRequested;
}

export class AddNames implements Action {
  readonly type = NameActionTypes.AddNames;

  constructor(public payload: { names: Name[] }) {}
}

export class ClearNames implements Action {
  readonly type = NameActionTypes.ClearNames;
}

export class NamesNotModified implements Action {
  readonly type = NameActionTypes.NamesNotModified;
}

export type NameActions =
 NamesRequested
 | AddNames
 | ClearNames
 | NamesNotModified;
