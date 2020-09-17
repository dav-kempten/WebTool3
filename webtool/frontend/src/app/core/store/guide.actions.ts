import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import {Guide} from '../../model/guide';

export enum GuideActionTypes {
  GuideNotModified = '[Guide] Guide not modified',
  GuideDeleteComplete = '[Guide] Guide delete complete',
  GuideDeactivateComplete = '[Guide] Guide deactivate complete',
  GuideCreateComplete = '[Guide] Guide create complete',
  GuideUpdateComplete = '[Guide] Guide update complete',
  RequestGuide = '[Guide] Request Guide',
  LoadGuides = '[Guide] Load Guides',
  AddGuide = '[Guide] Add Guide',
  UpsertGuide = '[Guide] Upsert Guide',
  AddEventGuide = '[Guide] AddEvent Guide',
  AddGuides = '[Guide] Add Guides',
  UpsertGuides = '[Guide] Upsert Guides',
  UpdateGuide = '[Guide] Update Guide',
  UpdateGuides = '[Guide] Update Guides',
  DeleteGuide = '[Guide] Delete Guide',
  DeleteGuides = '[Guide] Delete Guides',
  ClearGuides = '[Guide] Clear Guides',
  CreateGuide = '[Guide] Create Guide',
  CloneGuide = '[Guide] Clone Guide',
  DeactivateGuide = '[Guide] Deactivate Guide',
}

export class RequestGuide implements Action {
  readonly type = GuideActionTypes.RequestGuide;

  constructor(public payload: { id: number }) {}
}

export class GuideNotModified implements Action {
  readonly type = GuideActionTypes.GuideNotModified;
}

export class GuideDeleteComplete implements Action {
  readonly type = GuideActionTypes.GuideDeleteComplete;
}

export class GuideDeactivateComplete implements Action {
  readonly type = GuideActionTypes.GuideDeactivateComplete;
}

export class GuideCreateComplete implements Action {
  readonly type = GuideActionTypes.GuideCreateComplete;
}

export class GuideUpdateComplete implements Action {
  readonly type = GuideActionTypes.GuideUpdateComplete;
}

export class LoadGuides implements Action {
  readonly type = GuideActionTypes.LoadGuides;

  constructor(public payload: { guides: Guide[] }) {}
}

export class AddGuide implements Action {
  readonly type = GuideActionTypes.AddGuide;

  constructor(public payload: { guide: Guide }) {}
}

export class UpsertGuide implements Action {
  readonly type = GuideActionTypes.UpsertGuide;

  constructor(public payload: { guide: Guide }) {}
}

export class AddEventGuide implements Action {
  readonly type = GuideActionTypes.AddEventGuide;

  constructor(public payload: { guide: Guide }) {}
}

export class AddGuides implements Action {
  readonly type = GuideActionTypes.AddGuides;

  constructor(public payload: { guides: Guide[] }) {}
}

export class UpsertGuides implements Action {
  readonly type = GuideActionTypes.UpsertGuides;

  constructor(public payload: { guides: Guide[] }) {}
}

export class UpdateGuide implements Action {
  readonly type = GuideActionTypes.UpdateGuide;

  constructor(public payload: { guide: Update<Guide> }) {}
}

export class UpdateGuides implements Action {
  readonly type = GuideActionTypes.UpdateGuides;

  constructor(public payload: { guides: Update<Guide>[] }) {}
}

export class DeleteGuide implements Action {
  readonly type = GuideActionTypes.DeleteGuide;

  constructor(public payload: { id: number }) {}
}

export class DeleteGuides implements Action {
  readonly type = GuideActionTypes.DeleteGuides;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearGuides implements Action {
  readonly type = GuideActionTypes.ClearGuides;
}

export class CreateGuide implements Action {
  readonly type = GuideActionTypes.CreateGuide;

  constructor(public payload: { topicId: number, startDate: string}) {}
}

export class CloneGuide implements Action {
  readonly type = GuideActionTypes.CloneGuide;

  constructor(public payload: { id: number }) {}
}

export class DeactivateGuide implements Action {
  readonly type = GuideActionTypes.DeactivateGuide;

  constructor(public payload: { id: number }) {}
}

export type GuideActions =
  RequestGuide
  | GuideNotModified
  | GuideDeleteComplete
  | GuideDeactivateComplete
  | GuideCreateComplete
  | GuideUpdateComplete
  | LoadGuides
  | AddGuide
  | UpsertGuide
  | AddEventGuide
  | AddGuides
  | UpsertGuides
  | UpdateGuide
  | UpdateGuides
  | DeleteGuide
  | DeleteGuides
  | ClearGuides
  | CreateGuide
  | CloneGuide
  | DeactivateGuide;
