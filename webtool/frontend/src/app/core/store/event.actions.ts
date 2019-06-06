import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {Event} from '../../model/event';

export enum EventActionTypes {
  AddEvent = '[Event] Add Event',
  UpsertEvent = '[Event] Upsert Event',
  AddEvents = '[Event] Add Events',
  UpsertEvents = '[Event] Upsert Events',
  UpdateEvent = '[Event] Update Event',
  UpdateEvents = '[Event] Update Events',
  DeleteEvent = '[Event] Delete Event',
  DeleteEvents = '[Event] Delete Events',
  ClearEvents = '[Event] Clear Events'
}

export class AddEvent implements Action {
  readonly type = EventActionTypes.AddEvent;

  constructor(public payload: { event: Event }) {}
}

export class UpsertEvent implements Action {
  readonly type = EventActionTypes.UpsertEvent;

  constructor(public payload: { event: Event }) {}
}

export class AddEvents implements Action {
  readonly type = EventActionTypes.AddEvents;

  constructor(public payload: { events: Event[] }) {}
}

export class UpsertEvents implements Action {
  readonly type = EventActionTypes.UpsertEvents;

  constructor(public payload: { events: Event[] }) {}
}

export class UpdateEvent implements Action {
  readonly type = EventActionTypes.UpdateEvent;

  constructor(public payload: { event: Update<Event> }) {}
}

export class UpdateEvents implements Action {
  readonly type = EventActionTypes.UpdateEvents;

  constructor(public payload: { events: Update<Event>[] }) {}
}

export class DeleteEvent implements Action {
  readonly type = EventActionTypes.DeleteEvent;

  constructor(public payload: { id: number }) {}
}

export class DeleteEvents implements Action {
  readonly type = EventActionTypes.DeleteEvents;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearEvents implements Action {
  readonly type = EventActionTypes.ClearEvents;
}

export type EventActions =
 AddEvent
 | UpsertEvent
 | AddEvents
 | UpsertEvents
 | UpdateEvent
 | UpdateEvents
 | DeleteEvent
 | DeleteEvents
 | ClearEvents;
