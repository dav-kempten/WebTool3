import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Session } from './session.model';

export enum SessionActionTypes {
  SessionNotModified = '[Session] Session not modified',
  SessionCreateComplete = '[Session] Session create Complete',
  SessionDeleteComplete = '[Session] Session delete Complete',
  SessionDeactivateComplete = '[Session] Session deactivate Complete',
  RequestSession = '[Session] Request Session',
  LoadSessions = '[Session] Load Sessions',
  AddSession = '[Session] Add Session',
  UpsertSession = '[Session] Upsert Session',
  AddSessions = '[Session] Add Sessions',
  UpsertSessions = '[Session] Upsert Sessions',
  UpdateSession = '[Session] Update Session',
  UpdateSessions = '[Session] Update Sessions',
  DeleteSession = '[Session] Delete Session',
  DeleteSessions = '[Session] Delete Sessions',
  ClearSessions = '[Session] Clear Sessions',
  CreateSession = '[Session] Create Session',
  CloneSession = '[Session] Clone Session',
  DeactivateSession = '[Session] Deactivate Session',
}

export class RequestSession implements Action {
  readonly type = SessionActionTypes.RequestSession;

  constructor(public payload: { id: number }) {}
}

export class SessionNotModified implements Action {
  readonly type = SessionActionTypes.SessionNotModified;
}

export class SessionCreateComplete implements Action {
  readonly type = SessionActionTypes.SessionCreateComplete;
}

export class SessionDeleteComplete implements Action {
  readonly type = SessionActionTypes.SessionDeleteComplete;
}

export class SessionDeactivateComplete implements Action {
  readonly type = SessionActionTypes.SessionDeactivateComplete;
}

export class LoadSessions implements Action {
  readonly type = SessionActionTypes.LoadSessions;

  constructor(public payload: { sessions: Session[] }) {}
}

export class AddSession implements Action {
  readonly type = SessionActionTypes.AddSession;

  constructor(public payload: { session: Session }) {}
}

export class UpsertSession implements Action {
  readonly type = SessionActionTypes.UpsertSession;

  constructor(public payload: { session: Session }) {}
}

export class AddSessions implements Action {
  readonly type = SessionActionTypes.AddSessions;

  constructor(public payload: { sessions: Session[] }) {}
}

export class UpsertSessions implements Action {
  readonly type = SessionActionTypes.UpsertSessions;

  constructor(public payload: { sessions: Session[] }) {}
}

export class UpdateSession implements Action {
  readonly type = SessionActionTypes.UpdateSession;

  constructor(public payload: { session: Update<Session> }) {}
}

export class UpdateSessions implements Action {
  readonly type = SessionActionTypes.UpdateSessions;

  constructor(public payload: { sessions: Update<Session>[] }) {}
}

export class DeleteSession implements Action {
  readonly type = SessionActionTypes.DeleteSession;

  constructor(public payload: { id: number }) {}
}

export class DeleteSessions implements Action {
  readonly type = SessionActionTypes.DeleteSessions;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearSessions implements Action {
  readonly type = SessionActionTypes.ClearSessions;
}

export class CreateSession implements Action {
  readonly type = SessionActionTypes.CreateSession;

  constructor(public payload: { collectiveId: number, startDate: string}) {}
}

export class CloneSession implements Action {
  readonly type = SessionActionTypes.CloneSession;

  constructor(public payload: { id: number }) {}
}

export class DeactivateSession implements Action {
  readonly type = SessionActionTypes.DeactivateSession;

  constructor(public payload: { id: number }) {}
}

export type SessionActions =
  RequestSession
  | SessionNotModified
  | LoadSessions
  | AddSession
  | UpsertSession
  | AddSessions
  | UpsertSessions
  | UpdateSession
  | UpdateSessions
  | DeleteSession
  | DeleteSessions
  | ClearSessions
  | CreateSession
  | CloneSession
  | DeactivateSession;
