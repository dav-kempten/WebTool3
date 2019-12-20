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

    case GuideActionTypes.GuideNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.GuideDeleteComplete: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.GuideDeactivateComplete: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.GuideCreateComplete: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.GuideUpdateComplete: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideActionTypes.RequestGuide: {
      return {
        ... state,
        isLoading: true
      };
    }

    case GuideActionTypes.LoadGuides: {
      return adapter.addAll(action.payload.guides, state);
    }

    case GuideActionTypes.AddGuide: {
      return adapter.addOne(action.payload.guide, {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case GuideActionTypes.UpsertGuide: {
      return adapter.upsertOne(action.payload.guide, state);
    }

    case GuideActionTypes.AddEventGuide: {
      return adapter.addOne(action.payload.guide, state);
    }

    case GuideActionTypes.AddGuides: {
      return adapter.addMany(action.payload.guides, state);
    }

    case GuideActionTypes.UpsertGuides: {
      return adapter.upsertMany(action.payload.guides, state);
    }

    case GuideActionTypes.UpdateGuide: {
      return adapter.updateOne(action.payload.guide, state);
    }

    case GuideActionTypes.UpdateGuides: {
      return adapter.updateMany(action.payload.guides, state);
    }

    case GuideActionTypes.DeleteGuide: {
      return adapter.removeOne(action.payload.id, state);
    }

    case GuideActionTypes.DeleteGuides: {
      return adapter.removeMany(action.payload.ids, state);
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
