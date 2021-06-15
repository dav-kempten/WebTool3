import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {InstructionSummary} from './instruction-summary.model';
import {InstructionSummaryActions, InstructionSummaryActionTypes} from './instruction-summary.actions';

export interface State extends EntityState<InstructionSummary> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<InstructionSummary> = createEntityAdapter<InstructionSummary>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: InstructionSummaryActions): State {
  switch (action.type) {

    case InstructionSummaryActionTypes.RequestInstructionSummaries: {
      return {
        ... state,
        isLoading: true
      };
    }

    case InstructionSummaryActionTypes.InstructionSummariesNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    }

    case InstructionSummaryActionTypes.AddInstructionSummary: {
      return adapter.addOne(action.payload.instructionSummary, state);
    }

    case InstructionSummaryActionTypes.UpsertInstructionSummary: {
      return adapter.upsertOne(action.payload.instructionSummary, state);
    }

    case InstructionSummaryActionTypes.AddInstructionSummaries: {
      return adapter.addMany(action.payload.instructionSummaries, state);
    }

    case InstructionSummaryActionTypes.UpsertInstructionSummaries: {
      return adapter.upsertMany(action.payload.instructionSummaries, state);
    }

    case InstructionSummaryActionTypes.UpdateInstructionSummary: {
      return adapter.updateOne(action.payload.instructionSummary, state);
    }

    case InstructionSummaryActionTypes.UpdateInstructionSummaries: {
      return adapter.updateMany(action.payload.instructionSummaries, state);
    }

    case InstructionSummaryActionTypes.DeleteInstructionSummary: {
      return adapter.removeOne(action.payload.id, state);
    }

    case InstructionSummaryActionTypes.DeleteInstructionSummaries: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case InstructionSummaryActionTypes.LoadInstructionSummaries: {
      return adapter.addAll(
        action.payload.instructionSummaries,
        {
          ... state,
          isLoading: false,
          timestamp: new Date().getTime()
        }
      );
    }

    case InstructionSummaryActionTypes.ClearInstructionSummaries: {
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
