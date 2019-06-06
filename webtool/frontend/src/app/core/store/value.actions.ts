import {Action} from '@ngrx/store';
import {Values as RawValues} from '../../model/value';

export enum ValuesActionTypes {
  ValuesRequested = '[Values] ValueState requested',
  ValuesLoaded = '[Values] ValueState loaded',
  ValuesNotModified = '[Values] ValueState not mdofied'
}

export class ValuesRequested implements Action {
  readonly type = ValuesActionTypes.ValuesRequested;
}

export class ValuesLoaded implements Action {
  readonly type = ValuesActionTypes.ValuesLoaded;

  constructor(public payload: RawValues) {}
}

export class ValuesNotModified implements Action {
  readonly type = ValuesActionTypes.ValuesNotModified;
}

export type ValuesActions = ValuesRequested | ValuesLoaded | ValuesNotModified;
