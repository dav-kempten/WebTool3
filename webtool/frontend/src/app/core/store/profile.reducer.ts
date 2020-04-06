import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Profile} from '../../model/guide';
import {ProfileActions, ProfileActionTypes} from './profile.actions';

export interface State extends EntityState<Profile> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Profile> = createEntityAdapter<Profile>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: ProfileActions): State {
  switch (action.type) {

    case ProfileActionTypes.ProfileNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case ProfileActionTypes.RequestProfile: {
      return {
        ... state,
        isLoading: true
      };
    }

    case ProfileActionTypes.AddProfile: {
      return adapter.addOne(action.payload.profile, {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }
  }
}
