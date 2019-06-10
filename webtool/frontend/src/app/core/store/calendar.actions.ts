import { Action } from '@ngrx/store';
import {Calendar as RawCalendar} from '../../model/calendar';

export enum CalendarActionTypes {
  CalendarRequested = '[calendar] CalendarState requested',
  CalendarLoaded = '[calendar] CalendarState loaded',
  CalendarNotModified = '[calendar] CalendarState not modified'
}

export class CalendarRequested implements Action {
  readonly type = CalendarActionTypes.CalendarRequested;
}

export class CalendarLoaded implements Action {
  readonly type = CalendarActionTypes.CalendarLoaded;

  constructor(public payload: RawCalendar) {}
}

export class CalendarNotModified implements Action {
  readonly type = CalendarActionTypes.CalendarNotModified;
}


export type CalendarActions = CalendarRequested | CalendarLoaded | CalendarNotModified;
