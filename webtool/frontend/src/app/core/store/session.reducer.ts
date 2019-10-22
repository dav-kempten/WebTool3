import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Session} from './session.model';
import {SessionActions, SessionActionTypes} from './session.actions';

export interface State extends EntityState<Session> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Session> = createEntityAdapter<Session>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: SessionActions): State {
  switch (action.type) {

    case SessionActionTypes.RequestSession: {
      return {
        ... state,
        isLoading: true
      };
    }

    case SessionActionTypes.AddSession: {
      return adapter.addOne(action.payload.session, {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case SessionActionTypes.SessionNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case SessionActionTypes.UpsertSession: {
      return adapter.upsertOne(action.payload.session, state);
    }

    case SessionActionTypes.AddSessions: {
      return adapter.addMany(action.payload.sessions, state);
    }

    case SessionActionTypes.UpsertSessions: {
      return adapter.upsertMany(action.payload.sessions, state);
    }

    case SessionActionTypes.UpdateSession: {
      return adapter.updateOne(action.payload.session, state);
    }

    case SessionActionTypes.UpdateSessions: {
      return adapter.updateMany(action.payload.sessions, state);
    }

    case SessionActionTypes.DeleteSession: {
      return adapter.removeOne(action.payload.id, state);
    }

    case SessionActionTypes.DeleteSessions: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case SessionActionTypes.LoadSessions: {
      return adapter.addAll(action.payload.sessions, state);
    }

    case SessionActionTypes.ClearSessions: {
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
