import {Action} from '@ngrx/store';
import {Profile} from '../../model/guide';
import {Update} from '@ngrx/entity';

export enum ProfileActionTypes {
  AddProfile = '[Profile] Add Profile',
  UpsertProfile = '[Profile] Upsert Profile',
  UpdateProfile = '[Profile] Update Profile',
  DeleteProfile = '[Profile] Delete Profile',
  ClearProfiles = '[Profile] Clear Profile',
}

export class AddProfile implements Action {
  readonly type = ProfileActionTypes.AddProfile;

  constructor(public payload: { profile: Profile }) {}
}

export class UpsertProfile implements Action {
  readonly type = ProfileActionTypes.UpsertProfile;

  constructor(public payload: { profile: Profile }) {}
}

export class UpdateProfile implements Action {
  readonly type = ProfileActionTypes.UpdateProfile;

  constructor(public payload: { profile: Update<Profile> }) {}
}

export class DeleteProfile implements Action {
  readonly type = ProfileActionTypes.DeleteProfile;

  constructor(public payload: { id: number }) {}
}

export class ClearProfiles implements Action {
  readonly type = ProfileActionTypes.ClearProfiles;
}

export type ProfileActions =
  AddProfile
  | UpsertProfile
  | UpdateProfile
  | DeleteProfile
  | ClearProfiles;
