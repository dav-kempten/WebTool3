import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Tour} from './tour.model';
import {TourActions, TourActionTypes} from './tour.actions';

export interface State extends EntityState<Tour> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Tour> = createEntityAdapter<Tour>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: TourActions): State {
  switch (action.type) {

    case TourActionTypes.RequestTour: {
      return {
        ... state,
        isLoading: true
      };
    }

    case TourActionTypes.AddTour: {
      return adapter.addOne(action.payload.tour, {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case TourActionTypes.TourNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case TourActionTypes.UpsertTour: {
      return adapter.upsertOne(action.payload.tour, state);
    }

    case TourActionTypes.AddTours: {
      return adapter.addMany(action.payload.tours, state);
    }

    case TourActionTypes.UpsertTours: {
      return adapter.upsertMany(action.payload.tours, state);
    }

    case TourActionTypes.UpdateTour: {
      return adapter.updateOne(action.payload.tour, state);
    }

    case TourActionTypes.UpdateTours: {
      return adapter.updateMany(action.payload.tours, state);
    }

    case TourActionTypes.DeleteTour: {
      return adapter.removeOne(action.payload.id, state);
    }

    case TourActionTypes.DeleteTours: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case TourActionTypes.LoadTours: {
      return adapter.addAll(action.payload.tours, state);
    }

    case TourActionTypes.ClearTours: {
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
