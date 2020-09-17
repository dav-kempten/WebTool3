import {Action} from '@ngrx/store';
import {GuideSummary} from '../../model/guide';

export enum GuideSummaryActionTypes {
  RequestGuideSummaries = '[GuideSummary] Request GuideSummaries',
  LoadGuideSummaries = '[GuideSummary] Load GuideSummaries',
  AddGuideSummaries = '[GuideSummary] Add GuideSummaries',
  ClearGuideSummaries = '[GuideSummary] Clear GuideSummaries',
  GuideSummariesNotModified = '[GuideSummary] GuideSummaries not modified'
}

export class RequestGuideSummaries implements Action {
  readonly type = GuideSummaryActionTypes.RequestGuideSummaries;
}

export class LoadGuideSummaries implements Action {
  readonly type = GuideSummaryActionTypes.LoadGuideSummaries;

  constructor(public payload: { guideSummaries: GuideSummary[] }) {}
}

export class AddGuideSummaries implements Action {
  readonly type = GuideSummaryActionTypes.AddGuideSummaries;

  constructor(public payload: { guides: GuideSummary[] }) {}
}

export class ClearGuideSummaries implements Action {
  readonly type = GuideSummaryActionTypes.ClearGuideSummaries;
}

export class GuideSummariesNotModified implements Action {
  readonly type = GuideSummaryActionTypes.GuideSummariesNotModified;
}

export type GuideSummaryActions =
  RequestGuideSummaries
  | LoadGuideSummaries
  | AddGuideSummaries
  | ClearGuideSummaries
  | GuideSummariesNotModified;
