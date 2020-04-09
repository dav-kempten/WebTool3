import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './profile.reducer';

export const getProfileState = createFeatureSelector<State>('profiles');

export const getProfileById = (profileId: number) => createSelector(
  getProfileState, profileState => profileState.entities[profileId]
);
