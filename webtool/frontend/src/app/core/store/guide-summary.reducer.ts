import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {GuideSummaryActions, GuideSummaryActionTypes} from './guide-summary.actions';
import {GuideSummary} from '../../model/guide';

export interface State extends EntityState<GuideSummary> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<GuideSummary> = createEntityAdapter<GuideSummary>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: GuideSummaryActions): State {
  switch (action.type) {

    case GuideSummaryActionTypes.RequestGuideSummaries: {
      return {
        ...state,
        isLoading: true
      };
    }

    case GuideSummaryActionTypes.GuideSummariesNotModified: {
      return {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case GuideSummaryActionTypes.AddGuideSummaries: {
      return adapter.addMany(action.payload.guides, {
        ...state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case GuideSummaryActionTypes.ClearGuideSummaries: {
      return adapter.removeAll(state);
    }

    case GuideSummaryActionTypes.LoadGuideSummaries: {
      return adapter.addAll(
        action.payload.guideSummaries,
        {
          ... state,
          isLoading: false,
          timestamp: new Date().getTime()
        }
      );
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
