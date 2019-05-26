import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Topic} from '../../model/value';
import {TopicActions, TopicActionTypes} from './topic.actions';

export interface State extends EntityState<Topic> {}

export const adapter: EntityAdapter<Topic> = createEntityAdapter<Topic>();

export const initialState: State = adapter.getInitialState({});

export function reducer(state = initialState, action: TopicActions): State {
  switch (action.type) {

    case TopicActionTypes.AddTopics: {
      return adapter.addMany(action.payload.topics, state);
    }

    case TopicActionTypes.ClearTopics: {
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
