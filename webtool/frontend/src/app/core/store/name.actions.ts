import {Action} from '@ngrx/store';
import {NameList} from '../../model/name';

export enum NameListActionTypes {
  NameListRequested = '[Names] nameList requested',
  NameListLoaded = '[Names] nameList loaded',
  NameListNotModified = '[Names] nameList not modified'
}

export class NameListRequested implements Action {
  readonly type = NameListActionTypes.NameListRequested;
}

export class NameListLoaded implements Action {
  readonly type = NameListActionTypes.NameListLoaded;

  constructor(public payload: NameList) {}
}

export class NameListNotModified implements Action {
  readonly type = NameListActionTypes.NameListNotModified;
}

export type NameListActions = NameListRequested | NameListLoaded | NameListNotModified;
