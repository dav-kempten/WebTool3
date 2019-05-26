import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Approximate } from '../../model/value';
import { ApproximateActions, ApproximateActionTypes } from './approximate.actions';

export interface State extends EntityState<Approximate> {}

export const adapter: EntityAdapter<Approximate> = createEntityAdapter<Approximate>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: ApproximateActions): State {
  switch (action.type) {

    case ApproximateActionTypes.AddApproximates: {
      return adapter.addMany(action.payload.approximates, state);
    }

    case ApproximateActionTypes.ClearApproximates: {
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
