import {SessionSummary} from '../../model/session';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {SessionSummaryActions, SessionSummaryActionTypes} from './session-summary.actions';

export interface State extends EntityState<SessionSummary> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<SessionSummary> = createEntityAdapter<SessionSummary>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: SessionSummaryActions): State {
  switch (action.type) {

    case SessionSummaryActionTypes.RequestSessionSummaries: {
      return {
        ... state,
        isLoading: true
      };
    }

    case SessionSummaryActionTypes.SessionSummariesNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    }

    case SessionSummaryActionTypes.AddSessionSummary: {
      return adapter.addOne(action.payload.sessionSummary, state);
    }

    case SessionSummaryActionTypes.UpsertSessionSummary: {
      return adapter.upsertOne(action.payload.sessionSummary, state);
    }

    case SessionSummaryActionTypes.AddSessionSummaries: {
      return adapter.addMany(action.payload.sessionSummaries, state);
    }

    case SessionSummaryActionTypes.UpsertSessionSummaries: {
      return adapter.upsertMany(action.payload.sessionSummaries, state);
    }

    case SessionSummaryActionTypes.UpdateSessionSummary: {
      return adapter.updateOne(action.payload.sessionSummary, state);
    }

    case SessionSummaryActionTypes.UpdateSessionSummaries: {
      return adapter.updateMany(action.payload.sessionSummaries, state);
    }

    case SessionSummaryActionTypes.DeleteSessionSummary: {
      return adapter.removeOne(action.payload.id, state);
    }

    case SessionSummaryActionTypes.DeleteSessionSummaries: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case SessionSummaryActionTypes.LoadSessionSummaries: {
      return adapter.addAll(
        action.payload.sessionSummaries,
        {
          ... state,
          isLoading: false,
          timestamp: new Date().getTime()
        }
      );
    }

    case SessionSummaryActionTypes.ClearSessionSummaries: {
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

