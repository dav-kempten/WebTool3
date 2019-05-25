import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { State as RawState} from '../../model/value';
import { StateActions, StateActionTypes } from './state.actions';

export interface State extends EntityState<RawState> {}

export const adapter: EntityAdapter<RawState> = createEntityAdapter<RawState>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: StateActions): State {
  switch (action.type) {

    case StateActionTypes.AddStates: {
      return adapter.addMany(action.payload.states, state);
    }

    case StateActionTypes.ClearStates: {
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
