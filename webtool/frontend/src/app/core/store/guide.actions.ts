import {Action} from '@ngrx/store';
import {Guide} from '../../model/guide';

export enum GuideActionTypes {
  GuidesRequested = '[Guide] Request GuideState',
  AddGuides = '[Guide] Add Guides',
  ClearGuides = '[Guide] Clear Guides',
  GuidesNotModified = '[Guide] GuideState not modified'
}

export class GuidesRequested implements Action {
  readonly type = GuideActionTypes.GuidesRequested;
}

export class AddGuides implements Action {
  readonly type = GuideActionTypes.AddGuides;

  constructor(public payload: { guides: Guide[] }) {}
}

export class ClearGuides implements Action {
  readonly type = GuideActionTypes.ClearGuides;
}

export class GuidesNotModified implements Action {
  readonly type = GuideActionTypes.GuidesNotModified;
}

export type GuideActions =
 GuidesRequested
 | AddGuides
 | ClearGuides
 | GuidesNotModified;
