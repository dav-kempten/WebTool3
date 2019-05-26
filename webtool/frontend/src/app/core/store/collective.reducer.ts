import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Collective} from '../../model/value';
import {CollectiveActions, CollectiveActionTypes} from './collective.actions';

export interface State extends EntityState<Collective> {}

export const adapter: EntityAdapter<Collective> = createEntityAdapter<Collective>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: CollectiveActions): State {
  switch (action.type) {

    case CollectiveActionTypes.AddCollectives: {
      return adapter.addMany(action.payload.collectives, state);
    }

    case CollectiveActionTypes.ClearCollectives: {
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
