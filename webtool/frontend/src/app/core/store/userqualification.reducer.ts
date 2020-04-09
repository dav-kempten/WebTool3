import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { UserQualification } from '../../model/qualification';
import { UserQualificationActions, UserQualificationActionTypes } from './userqualification.actions';

export interface State extends EntityState<UserQualification> {}

export const adapter: EntityAdapter<UserQualification> = createEntityAdapter<UserQualification>();

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: UserQualificationActions): State {
  switch (action.type) {
    case UserQualificationActionTypes.AddUserQualification: {
      return adapter.addOne(action.payload.userQualification, state);
    }

    case UserQualificationActionTypes.UpsertUserQualification: {
      return adapter.upsertOne(action.payload.userQualification, state);
    }

    case UserQualificationActionTypes.AddUserQualifications: {
      return adapter.addMany(action.payload.userQualifications, state);
    }

    case UserQualificationActionTypes.UpsertUserQualifications: {
      return adapter.upsertMany(action.payload.userQualifications, state);
    }

    case UserQualificationActionTypes.UpdateUserQualification: {
      return adapter.updateOne(action.payload.userQualification, state);
    }

    case UserQualificationActionTypes.UpdateUserQualifications: {
      return adapter.updateMany(action.payload.userQualifications, state);
    }

    case UserQualificationActionTypes.DeleteUserQualification: {
      return adapter.removeOne(action.payload.id, state);
    }

    case UserQualificationActionTypes.DeleteUserQualifications: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case UserQualificationActionTypes.ClearUserQualifications: {
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
