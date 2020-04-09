import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Retraining } from '../../model/retraining';
import { RetrainingActions, RetrainingActionTypes } from './retraining.actions';

export interface State extends EntityState<Retraining> {}

export const adapter: EntityAdapter<Retraining> = createEntityAdapter<Retraining>();

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: RetrainingActions): State {
  switch (action.type) {
    case RetrainingActionTypes.AddRetraining: {
      return adapter.addOne(action.payload.retraining, state);
    }

    case RetrainingActionTypes.UpsertRetraining: {
      return adapter.upsertOne(action.payload.retraining, state);
    }

    case RetrainingActionTypes.AddRetrainings: {
      return adapter.addMany(action.payload.retrainings, state);
    }

    case RetrainingActionTypes.UpsertRetrainings: {
      return adapter.upsertMany(action.payload.retrainings, state);
    }

    case RetrainingActionTypes.UpdateRetraining: {
      return adapter.updateOne(action.payload.retraining, state);
    }

    case RetrainingActionTypes.UpdateRetrainings: {
      return adapter.updateMany(action.payload.retrainings, state);
    }

    case RetrainingActionTypes.DeleteRetraining: {
      return adapter.removeOne(action.payload.id, state);
    }

    case RetrainingActionTypes.DeleteRetrainings: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case RetrainingActionTypes.ClearRetrainings: {
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
