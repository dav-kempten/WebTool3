import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {GuideActions, GuideActionTypes} from './guide.actions';
import {Guide} from '../../model/guide';

export interface State extends EntityState<Guide> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Guide> = createEntityAdapter<Guide>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: GuideActions): State {
  switch (action.type) {

    case GuideActionTypes.GuidesRequested: {
      return {
        ...state,
        isLoading: true
      };
    }

    case GuideActionTypes.GuidesNotModified: {
      return {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.AddGuides: {
      return adapter.addMany(action.payload.guides, {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case GuideActionTypes.ClearGuides: {
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
