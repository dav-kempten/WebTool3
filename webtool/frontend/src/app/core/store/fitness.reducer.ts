import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Fitness} from '../../model/value';
import {FitnessActions, FitnessActionTypes} from './fitness.actions';

export interface State extends EntityState<Fitness> {}

export const adapter: EntityAdapter<Fitness> = createEntityAdapter<Fitness>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: FitnessActions): State {
  switch (action.type) {

    case FitnessActionTypes.AddFitness: {
      return adapter.addMany(action.payload.fitness, state);
    }

    case FitnessActionTypes.ClearFitness: {
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
