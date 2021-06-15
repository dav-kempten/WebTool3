import {TourSummary} from './tour-summary.model';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {TourSummaryActions, TourSummaryActionTypes} from './tour-summary.actions';

export interface State extends EntityState<TourSummary> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<TourSummary> = createEntityAdapter<TourSummary>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: TourSummaryActions): State {
  switch (action.type) {

    case TourSummaryActionTypes.RequestTourSummaries: {
      return {
        ... state,
        isLoading: true
      };
    }

    case TourSummaryActionTypes.TourSummariesNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    }

    case TourSummaryActionTypes.AddTourSummary: {
      return adapter.addOne(action.payload.tourSummary, state);
    }

    case TourSummaryActionTypes.UpsertTourSummary: {
      return adapter.upsertOne(action.payload.tourSummary, state);
    }

    case TourSummaryActionTypes.AddTourSummaries: {
      return adapter.addMany(action.payload.tourSummaries, state);
    }

    case TourSummaryActionTypes.UpsertTourSummaries: {
      return adapter.upsertMany(action.payload.tourSummaries, state);
    }

    case TourSummaryActionTypes.UpdateTourSummary: {
      return adapter.updateOne(action.payload.tourSummary, state);
    }

    case TourSummaryActionTypes.UpdateTourSummaries: {
      return adapter.updateMany(action.payload.tourSummaries, state);
    }

    case TourSummaryActionTypes.DeleteTourSummary: {
      return adapter.removeOne(action.payload.id, state);
    }

    case TourSummaryActionTypes.DeleteTourSummaries: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case TourSummaryActionTypes.LoadTourSummaries: {
      return adapter.addAll(
        action.payload.tourSummaries,
        {
          ... state,
          isLoading: false,
          timestamp: new Date().getTime()
        }
      );
    }

    case TourSummaryActionTypes.ClearTourSummaries: {
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

