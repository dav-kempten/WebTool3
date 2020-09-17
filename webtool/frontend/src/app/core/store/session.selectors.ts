import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './session.reducer';

export const getSessionState = createFeatureSelector<State>('sessions');

export const getSessionById = (sessionId: number) => createSelector(
  getSessionState, sessionState => sessionState.entities[sessionId]
);

export const getSessionIsLoading = createSelector(getSessionState, (state: State) => state.isLoading);
