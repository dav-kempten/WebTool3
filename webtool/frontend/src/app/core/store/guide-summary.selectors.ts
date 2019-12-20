import {createFeatureSelector, createSelector} from '@ngrx/store';
import {selectAll, State} from './guide-summary.reducer';

// export const getGuidesState = createFeatureSelector<State>('guides');
//
// export const getGuidesIsLoading = createSelector(getGuidesState, (state: State) => state.isLoading);
//
// export const getGuideById = (guideId: number) => createSelector(
//   getGuidesState,
//     state => state.entities[guideId]
// );
//
// export const getGuides = createSelector(
//   getGuidesState,
//   selectAll
// );

export const getGuideSummaryState = createFeatureSelector<State>('guideSummaries');
export const getGuideSummaries = createSelector(getGuideSummaryState, selectAll);
