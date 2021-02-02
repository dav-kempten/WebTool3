import {Action} from '@ngrx/store';
import {Fullcalendar} from '../../model/fullcalendars';

export enum TourcalendarsActionTypes {
  RequestTourcalendars = '[TourCalendars] Request Tourcalendar',
  LoadTourcalendars = '[TourCalendars] Load Tourcalendar',
  TourcalendarsNotModified = '[TourCalendars] Tourcalendar not modified'
}

export class RequestTourcalendars implements Action {
  readonly type = TourcalendarsActionTypes.RequestTourcalendars;
}

export class LoadTourcalendars implements Action {
  readonly type = TourcalendarsActionTypes.LoadTourcalendars;

  constructor(public payload: {tours: Fullcalendar[]}) {}
}

export class TourcalendarsNotModified implements Action {
  readonly type = TourcalendarsActionTypes.TourcalendarsNotModified;
}

export type TourcalendarsActions = RequestTourcalendars | LoadTourcalendars | TourcalendarsNotModified;
