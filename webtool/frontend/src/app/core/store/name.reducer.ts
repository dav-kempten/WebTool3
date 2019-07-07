import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {NameActions, NameActionTypes} from './name.actions';
import {Name} from '../../model/name';

export interface State extends EntityState<Name> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Name> = createEntityAdapter<Name>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: NameActions): State {
  switch (action.type) {

    case NameActionTypes.NamesRequested: {
      return {
        ...state,
        isLoading: true
      };
    }

    case NameActionTypes.NamesNotModified: {
      return {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case NameActionTypes.AddNames: {
      return adapter.addMany(action.payload.names, {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case NameActionTypes.ClearNames: {
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
