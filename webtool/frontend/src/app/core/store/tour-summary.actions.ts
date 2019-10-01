import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { TourSummary } from '../../model/tour';

export enum TourSummaryActionTypes {
  TourSummariesNotModified = '[TourSummary] TourSummaries not modified',
  RequestTourSummaries = '[TourSummary] Request TourSummaries',
  LoadTourSummaries = '[TourSummary] Load TourSummaries',
  AddTourSummary = '[TourSummary] Add TourSummary',
  UpsertTourSummary = '[TourSummary] Upsert TourSummary',
  AddTourSummaries = '[TourSummary] Add TourSummaries',
  UpsertTourSummaries = '[TourSummary] Upsert TourSummaries',
  UpdateTourSummary = '[TourSummary] Update TourSummary',
  UpdateTourSummaries = '[TourSummary] Update TourSummaries',
  DeleteTourSummary = '[TourSummary] Delete TourSummary',
  DeleteTourSummaries = '[TourSummary] Delete TourSummaries',
  ClearTourSummaries = '[TourSummary] Clear TourSummaries'
}

export class RequestTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.RequestTourSummaries;
}

export class TourSummariesNotModified implements Action {
  readonly type = TourSummaryActionTypes.TourSummariesNotModified;
}

export class LoadTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.LoadTourSummaries;

  constructor(public payload: { tourSummaries: TourSummary[] }) {}
}

export class AddTourSummary implements Action {
  readonly type = TourSummaryActionTypes.AddTourSummary;

  constructor(public payload: { tourSummary: TourSummary }) {}
}

export class UpsertTourSummary implements Action {
  readonly type = TourSummaryActionTypes.UpsertTourSummary;

  constructor(public payload: { tourSummary: TourSummary }) {}
}

export class AddTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.AddTourSummaries;

  constructor(public payload: { tourSummaries: TourSummary[] }) {}
}

export class UpsertTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.UpsertTourSummaries;

  constructor(public payload: { tourSummaries: TourSummary[] }) {}
}

export class UpdateTourSummary implements Action {
  readonly type = TourSummaryActionTypes.UpdateTourSummary;

  constructor(public payload: { tourSummary: Update<TourSummary> }) {}
}

export class UpdateTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.UpdateTourSummaries;

  constructor(public payload: { tourSummaries: Update<TourSummary>[] }) {}
}

export class DeleteTourSummary implements Action {
  readonly type = TourSummaryActionTypes.DeleteTourSummary;

  constructor(public payload: { id: number }) {}
}

export class DeleteTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.DeleteTourSummaries;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearTourSummaries implements Action {
  readonly type = TourSummaryActionTypes.ClearTourSummaries;
}

export type TourSummaryActions =
  RequestTourSummaries
  | TourSummariesNotModified
  | LoadTourSummaries
  | AddTourSummary
  | UpsertTourSummary
  | AddTourSummaries
  | UpsertTourSummaries
  | UpdateTourSummary
  | UpdateTourSummaries
  | DeleteTourSummary
  | DeleteTourSummaries
  | ClearTourSummaries;
