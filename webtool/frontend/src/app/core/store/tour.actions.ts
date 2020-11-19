import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Tour } from './tour.model';

export enum TourActionTypes {
  TourNotModified = '[Tour] Tour not modified',
  TourDeleteComplete = '[Tour] Tour delete complete',
  TourDeactivateComplete = '[Tour] Tour deactivate complete',
  TourUpdateComplete = '[Tour] Tour update complete',
  TourCreateComplete = '[Tour] Tour create complete',
  RequestTour = '[Tour] Request Tour',
  LoadTours = '[Tour] Load Tours',
  AddTour = '[Tour] Add Tour',
  UpsertTour = '[Tour] Upsert Tour',
  AddTours = '[Tour] Add Tours',
  UpsertTours = '[Tour] Upsert Tours',
  UpdateTour = '[Tour] Update Tour',
  UpdateTours = '[Tour] Update Tours',
  DeleteTour = '[Tour] Delete Tour',
  DeleteTours = '[Tour] Delete Tours',
  ClearTours = '[Tour] Clear Tours',
  CreateTour = '[Tour] Create Tour',
  CloneTour = '[Tour] Clone Tour',
  DeactivateTour = '[Tour] Deactivate Tour',
}

export class RequestTour implements Action {
  readonly type = TourActionTypes.RequestTour;

  constructor(public payload: { id: number }) {}
}

export class TourNotModified implements Action {
  readonly type = TourActionTypes.TourNotModified;
}

export class TourDeleteComplete implements Action {
  readonly type = TourActionTypes.TourDeleteComplete;
}

export class TourDeactivateComplete implements Action {
  readonly type = TourActionTypes.TourDeactivateComplete;
}

export class TourUpdateComplete implements Action {
  readonly type = TourActionTypes.TourUpdateComplete;
}

export class TourCreateComplete implements Action {
  readonly type = TourActionTypes.TourCreateComplete;
}

export class LoadTours implements Action {
  readonly type = TourActionTypes.LoadTours;

  constructor(public payload: { tours: Tour[] }) {}
}

export class AddTour implements Action {
  readonly type = TourActionTypes.AddTour;

  constructor(public payload: { tour: Tour }) {}
}

export class UpsertTour implements Action {
  readonly type = TourActionTypes.UpsertTour;

  constructor(public payload: { tour: Tour }) {}
}

export class AddTours implements Action {
  readonly type = TourActionTypes.AddTours;

  constructor(public payload: { tours: Tour[] }) {}
}

export class UpsertTours implements Action {
  readonly type = TourActionTypes.UpsertTours;

  constructor(public payload: { tours: Tour[] }) {}
}

export class UpdateTour implements Action {
  readonly type = TourActionTypes.UpdateTour;

  constructor(public payload: { tour: Update<Tour> }) {}
}

export class UpdateTours implements Action {
  readonly type = TourActionTypes.UpdateTours;

  constructor(public payload: { tours: Update<Tour>[] }) {}
}

export class DeleteTour implements Action {
  readonly type = TourActionTypes.DeleteTour;

  constructor(public payload: { id: number }) {}
}

export class DeleteTours implements Action {
  readonly type = TourActionTypes.DeleteTours;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearTours implements Action {
  readonly type = TourActionTypes.ClearTours;
}

export class CreateTour implements Action {
  readonly type = TourActionTypes.CreateTour;

  constructor(public payload: { categoryId: number, startDate: string, deadline: string, preliminary: string,
    guideId: number}) {}
}

export class CloneTour implements Action {
  readonly type = TourActionTypes.CloneTour;

  constructor(public payload: { tour: Tour }) {}
}

export class DeactivateTour implements Action {
  readonly type = TourActionTypes.DeactivateTour;

  constructor(public payload: { id: number }) {}
}

export type TourActions =
  RequestTour
  | TourNotModified
  | TourDeleteComplete
  | TourDeactivateComplete
  | TourUpdateComplete
  | LoadTours
  | AddTour
  | UpsertTour
  | AddTours
  | UpsertTours
  | UpdateTour
  | UpdateTours
  | DeleteTour
  | DeleteTours
  | ClearTours
  | CreateTour
  | CloneTour
  | DeactivateTour;
