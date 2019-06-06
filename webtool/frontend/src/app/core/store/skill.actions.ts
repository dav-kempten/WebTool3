import {Action} from '@ngrx/store';
import {Skill} from '../../model/value';

export enum SkillActionTypes {
  AddSkills = '[Skill] Add Skills',
  ClearSkills = '[Skill] Clear Skills'
}

export class AddSkills implements Action {
  readonly type = SkillActionTypes.AddSkills;

  constructor(public payload: { skills: Skill[] }) {}
}

export class ClearSkills implements Action {
  readonly type = SkillActionTypes.ClearSkills;
}

export type SkillActions = AddSkills | ClearSkills;
