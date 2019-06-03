import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Instruction} from './instruction.model';
import {InstructionActions, InstructionActionTypes} from './instruction.actions';

export interface State extends EntityState<Instruction> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Instruction> = createEntityAdapter<Instruction>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: InstructionActions): State {
  switch (action.type) {

    case InstructionActionTypes.RequestInstruction: {
      return {
        ... state,
        isLoading: true
      };
    }

    case InstructionActionTypes.AddInstruction: {
      return adapter.addOne(action.payload.instruction, {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      });
    }

    case InstructionActionTypes.InstructionNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case InstructionActionTypes.UpsertInstruction: {
      return adapter.upsertOne(action.payload.instruction, state);
    }

    case InstructionActionTypes.AddInstructions: {
      return adapter.addMany(action.payload.instructions, state);
    }

    case InstructionActionTypes.UpsertInstructions: {
      return adapter.upsertMany(action.payload.instructions, state);
    }

    case InstructionActionTypes.UpdateInstruction: {
      return adapter.updateOne(action.payload.instruction, state);
    }

    case InstructionActionTypes.UpdateInstructions: {
      return adapter.updateMany(action.payload.instructions, state);
    }

    case InstructionActionTypes.DeleteInstruction: {
      return adapter.removeOne(action.payload.id, state);
    }

    case InstructionActionTypes.DeleteInstructions: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case InstructionActionTypes.LoadInstructions: {
      return adapter.addAll(action.payload.instructions, state);
    }

    case InstructionActionTypes.ClearInstructions: {
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
