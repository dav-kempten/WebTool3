import {Action} from '@ngrx/store';
import {Values as RawValues} from '../../model/value';

export enum ValuesActionTypes {
  ValuesRequested = '[values] ValueState requested',
  ValuesLoaded = '[values] ValueState loaded',
  ValuesNotModified = '[values] ValueState not mdofied'
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
