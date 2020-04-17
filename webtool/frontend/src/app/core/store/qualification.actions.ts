import {Action} from '@ngrx/store';
import {Qualification} from '../../model/value';

export enum QualificationActionTypes {
  AddQualifications = '[Qualification] Add Qualifications',
  ClearQualifications = '[Qualification] Clear Qualifications'
}

export class AddQualifications implements Action {
  readonly type = QualificationActionTypes.AddQualifications;

  constructor(public payload: { qualifications: Qualification[] }) {}
}

export class ClearQualifications implements Action {
  readonly type = QualificationActionTypes.ClearQualifications;
}

export type QualificationActions = AddQualifications | ClearQualifications;
