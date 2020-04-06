import {Action} from '@ngrx/store';
import {Profile} from '../../model/guide';

export enum ProfileActionTypes {
  ProfileNotModified = '[Profile] Profile not modified',
  RequestProfile = '[Profile] Request Profile',
  AddProfile = '[Profile] Add Profile',
}

export class RequestProfile implements Action {
  readonly type = ProfileActionTypes.RequestProfile;

  constructor(public payload: { id: number }) {}
}

export class ProfileNotModified implements Action {
  readonly type = ProfileActionTypes.ProfileNotModified;
}

export class AddProfile implements Action {
  readonly type = ProfileActionTypes.AddProfile;

  constructor(public payload: { profile: Profile }) {}
}

export type ProfileActions =
  RequestProfile
  | ProfileNotModified
  | AddProfile;
