import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Category } from '../../model/value';
import { CategoryActions, CategoryActionTypes } from './category.actions';

export interface State extends EntityState<Category> {}

export const adapter: EntityAdapter<Category> = createEntityAdapter<Category>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: CategoryActions): State {
  switch (action.type) {

    case CategoryActionTypes.AddCategories: {
      return adapter.addMany(action.payload.categories, state);
    }

    case CategoryActionTypes.ClearCategories: {
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
