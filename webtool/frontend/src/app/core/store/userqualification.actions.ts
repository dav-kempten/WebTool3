import {Action} from '@ngrx/store';
import {Update} from '@ngrx/entity';
import {UserQualification} from '../../model/qualification';

export enum UserQualificationActionTypes {
  AddUserQualification = '[UserQualification] Add UserQualification',
  UpsertUserQualification = '[UserQualification] Upsert UserQualification',
  AddUserQualifications = '[UserQualification] Add UserQualifications',
  UpsertUserQualifications = '[UserQualification] Upsert UserQualifications',
  UpdateUserQualification = '[UserQualification] Update UserQualification',
  UpdateUserQualifications = '[UserQualification] Update UserQualifications',
  DeleteUserQualification = '[UserQualification] Delete UserQualification',
  DeleteUserQualifications = '[UserQualification] Delete UserQualifications',
  ClearUserQualifications = '[UserQualification] Clear UserQualifications',
  CreateUserQualification = '[UserQualification] Create UserQualifications',
}

export class AddUserQualification implements Action {
  readonly type = UserQualificationActionTypes.AddUserQualification;

  constructor(public payload: { userQualification: UserQualification }) {}
}

export class UpsertUserQualification implements Action {
  readonly type = UserQualificationActionTypes.UpsertUserQualification;

  constructor(public payload: { userQualification: UserQualification }) {}
}

export class AddUserQualifications implements Action {
  readonly type = UserQualificationActionTypes.AddUserQualifications;

  constructor(public payload: { userQualifications: UserQualification[] }) {}
}

export class UpsertUserQualifications implements Action {
  readonly type = UserQualificationActionTypes.UpsertUserQualifications;

  constructor(public payload: { userQualifications: UserQualification[] }) {}
}

export class UpdateUserQualification implements Action {
  readonly type = UserQualificationActionTypes.UpdateUserQualification;

  constructor(public payload: { userQualification: Update<UserQualification> }) {}
}

export class UpdateUserQualifications implements Action {
  readonly type = UserQualificationActionTypes.UpdateUserQualifications;

  constructor(public payload: { userQualifications: Update<UserQualification>[] }) {}
}

export class DeleteUserQualification implements Action {
  readonly type = UserQualificationActionTypes.DeleteUserQualification;

  constructor(public payload: { id: number }) {}
}

export class DeleteUserQualifications implements Action {
  readonly type = UserQualificationActionTypes.DeleteUserQualifications;

  constructor(public payload: { ids: number[] }) {}
}

export class ClearUserQualifications implements Action {
  readonly type = UserQualificationActionTypes.ClearUserQualifications;
}

export class CreateUserQualification implements Action {
  readonly type = UserQualificationActionTypes.CreateUserQualification;

  constructor(public payload: { id: number }) {}
}

export type UserQualificationActions =
 AddUserQualification
 | UpsertUserQualification
 | AddUserQualifications
 | UpsertUserQualifications
 | UpdateUserQualification
 | UpdateUserQualifications
 | DeleteUserQualification
 | DeleteUserQualifications
 | ClearUserQualifications
 | CreateUserQualification;
