import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import {Skill} from '../../model/value';
import { SkillActions, SkillActionTypes } from './skill.actions';

export interface State extends EntityState<Skill> {}

export const adapter: EntityAdapter<Skill> = createEntityAdapter<Skill>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: SkillActions): State {
  switch (action.type) {

    case SkillActionTypes.AddSkills: {
      return adapter.addMany(action.payload.skills, state);
    }

    case SkillActionTypes.ClearSkills: {
      return adapter.removeAll(state);
    }

    default: {
      return state;
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
