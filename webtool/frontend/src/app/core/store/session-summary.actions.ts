import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { SessionSummary } from '../../model/session';

export enum SessionSummaryActionTypes {
  SessionSummariesNotModified = '[SessionSummary] SessionSummaries not modified',
  RequestSessionSummaries = '[SessionSummary] Request SessionSummaries',
  LoadSessionSummaries = '[SessionSummary] Load SessionSummaries',
  AddSessionSummary = '[SessionSummary] Add SessionSummary',
  UpsertSessionSummary = '[SessionSummary] Upsert SessionSummary',
  AddSessionSummaries = '[SessionSummary] Add SessionSummaries',
  UpsertSessionSummaries = '[SessionSummary] Upsert SessionSummaries',
  UpdateSessionSummary = '[SessionSummary] Update SessionSummary',
  UpdateSessionSummaries = '[SessionSummary] Update SessionSummaries',
  DeleteSessionSummary = '[SessionSummary] Delete SessionSummary',
  DeleteSessionSummaries = '[SessionSummary] Delete SessionSummaries',
  ClearSessionSummaries = '[SessionSummary] Clear SessionSummaries'
}

export class RequestSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.RequestSessionSummaries;
}

export class SessionSummariesNotModified implements Action {
  readonly type = SessionSummaryActionTypes.SessionSummariesNotModified;
}

export class LoadSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.LoadSessionSummaries;

  constructor(public payload: { sessionSummaries: SessionSummary[] }) {}
}

export class AddSessionSummary implements Action {
  readonly type = SessionSummaryActionTypes.AddSessionSummary;

  constructor(public payload: { sessionSummary: SessionSummary }) {}
}

export class UpsertSessionSummary implements Action {
  readonly type = SessionSummaryActionTypes.UpsertSessionSummary;

  constructor(public payload: { sessionSummary: SessionSummary }) {}
}

export class AddSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.AddSessionSummaries;

  constructor(public payload: { sessionSummaries: SessionSummary[] }) {}
}

export class UpsertSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.UpsertSessionSummaries;

  constructor(public payload: { sessionSummaries: SessionSummary[] }) {}
}

export class UpdateSessionSummary implements Action {
  readonly type = SessionSummaryActionTypes.UpdateSessionSummary;

  constructor(public payload: { sessionSummary: Update<SessionSummary> }) {}
}

export class UpdateSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.UpdateSessionSummaries;

  constructor(public payload: { sessionSummaries: Update<SessionSummary>[] }) {}
}

export class DeleteSessionSummary implements Action {
  readonly type = SessionSummaryActionTypes.DeleteSessionSummary;

  constructor(public payload: { id: number }) {}
}

export class DeleteSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.DeleteSessionSummaries;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearSessionSummaries implements Action {
  readonly type = SessionSummaryActionTypes.ClearSessionSummaries;
}

export type SessionSummaryActions =
  RequestSessionSummaries
  | SessionSummariesNotModified
  | LoadSessionSummaries
  | AddSessionSummary
  | UpsertSessionSummary
  | AddSessionSummaries
  | UpsertSessionSummaries
  | UpdateSessionSummary
  | UpdateSessionSummaries
  | DeleteSessionSummary
  | DeleteSessionSummaries
  | ClearSessionSummaries;
