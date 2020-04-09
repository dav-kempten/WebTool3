import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Profile} from '../../model/guide';
import {ProfileActions, ProfileActionTypes} from './profile.actions';

export interface State extends EntityState<Profile> {}

export const adapter: EntityAdapter<Profile> = createEntityAdapter<Profile>();

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: ProfileActions): State {
  switch (action.type) {
    case ProfileActionTypes.AddProfile: {
      return adapter.addOne(action.payload.profile, state);
    }

    case ProfileActionTypes.UpsertProfile: {
      return adapter.upsertOne(action.payload.profile, state);
    }

    case ProfileActionTypes.UpdateProfile: {
      return adapter.updateOne(action.payload.profile, state);
    }

    case ProfileActionTypes.DeleteProfile: {
      return adapter.removeOne(action.payload.id, state);
    }

    case ProfileActionTypes.ClearProfiles: {
      return adapter.removeAll(state);
    }

    default: {
      return state;
    }
  }
}
