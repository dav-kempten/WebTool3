import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Event } from '../../model/event';
import { EventActions, EventActionTypes } from './event.actions';

export interface State extends EntityState<Event> {}

export const adapter: EntityAdapter<Event> = createEntityAdapter<Event>();

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: EventActions): State {
  switch (action.type) {
    case EventActionTypes.AddEvent: {
      return adapter.addOne(action.payload.event, state);
    }

    case EventActionTypes.UpsertEvent: {
      return adapter.upsertOne(action.payload.event, state);
    }

    case EventActionTypes.AddEvents: {
      return adapter.addMany(action.payload.events, state);
    }

    case EventActionTypes.UpsertEvents: {
      return adapter.upsertMany(action.payload.events, state);
    }

    case EventActionTypes.UpdateEvent: {
      return adapter.updateOne(action.payload.event, state);
    }

    case EventActionTypes.UpdateEvents: {
      return adapter.updateMany(action.payload.events, state);
    }

    case EventActionTypes.DeleteEvent: {
      return adapter.removeOne(action.payload.id, state);
    }

    case EventActionTypes.DeleteEvents: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case EventActionTypes.ClearEvents: {
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
