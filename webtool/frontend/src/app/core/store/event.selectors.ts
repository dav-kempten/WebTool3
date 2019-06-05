import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './event.reducer';

export const getEventState = createFeatureSelector<State>('events');

export const getEventById = (eventId: number) => createSelector(
  getEventState, eventState => eventState.entities[eventId]
);

export const getEventsByIds = (eventIds: number[]) => createSelector(
  getEventState, eventState => Object.values(eventState.entities)
      .filter(event => eventIds.includes(event.id))
);
