import {createFeatureSelector, createSelector} from '@ngrx/store';
import {State} from './userqualification.reducer';

export const getUserQualificationState = createFeatureSelector<State>('userQualifications');

export const getUserQualificationById = (userqualificationId: number) => createSelector(
  getUserQualificationState, userqualificationState => userqualificationState.entities[userqualificationId]
);

export const getUserQualificationByIds = (userqualificationIds: number[]) => createSelector(
  getUserQualificationState, userqualificationState => Object.values(userqualificationState.entities)
      .filter(userqualification => userqualificationIds.includes(userqualification.id))
);
