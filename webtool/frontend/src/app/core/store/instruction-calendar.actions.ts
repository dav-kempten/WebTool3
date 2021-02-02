import {Action} from '@ngrx/store';
import {Fullcalendar} from '../../model/fullcalendars';

export enum InstructioncalendarsActionTypes {
  RequestInstructioncalendars = '[InstructionCalendars] Request Instructioncalendar',
  LoadInstructioncalendars = '[InstructionCalendars] Load Instructioncalendar',
  InstructioncalendarsNotModified = '[InstructionCalendars] Instructioncalendar not modified'
}

export class RequestInstructioncalendars implements Action {
  readonly type = InstructioncalendarsActionTypes.RequestInstructioncalendars;
}

export class LoadInstructioncalendars implements Action {
  readonly type = InstructioncalendarsActionTypes.LoadInstructioncalendars;

  constructor(public payload: {fullcalendar: Fullcalendar[]}) {}
}

export class InstructioncalendarsNotModified implements Action {
  readonly type = InstructioncalendarsActionTypes.InstructioncalendarsNotModified;
}

export type InstructioncalendarsActions = RequestInstructioncalendars | LoadInstructioncalendars | InstructioncalendarsNotModified;
