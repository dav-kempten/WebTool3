import {createFeatureSelector, createSelector} from '@ngrx/store';
import {NameListState} from './name.reducer';

export const getNameListState = createFeatureSelector<NameListState>('nameList');

export const getNameList = createSelector(getNameListState, (state: NameListState) => state.names);
export const getNameListIndex = createSelector(getNameListState, (state: NameListState) => state.index);
export const getNameListTimestamp = createSelector(getNameListState, (state: NameListState) => state.timestamp);
export const getNameListIsLoading = createSelector(getNameListState, (state: NameListState) => state.isLoading);

export const getNameById = createSelector(
  getNameListState, (state: NameListState, props) => state.names[state.index[props.nameId]]
);
