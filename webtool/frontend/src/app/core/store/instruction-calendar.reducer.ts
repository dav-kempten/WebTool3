import {Fullcalendar} from '../../model/fullcalendars';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {InstructioncalendarsActions, InstructioncalendarsActionTypes} from './instruction-calendar.actions';

export interface State extends EntityState<Fullcalendar> {
  isLoading: boolean;
  timestamp: number;
}

export const adapter: EntityAdapter<Fullcalendar> = createEntityAdapter<Fullcalendar>();

export const initialState: State = adapter.getInitialState({
  isLoading: false,
  timestamp: 0
});

export function reducer(state = initialState, action: InstructioncalendarsActions): State {
  switch (action.type) {

    case InstructioncalendarsActionTypes.RequestInstructioncalendars: {
      return {
        ... state,
        isLoading: true
      };
    }

    case InstructioncalendarsActionTypes.InstructioncalendarsNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case InstructioncalendarsActionTypes.LoadInstructioncalendars: {
      return adapter.addAll(
        action.payload.fullcalendar,
        {
          ... state,
          isLoading: false,
          timestamp: new Date().getTime()
        }
      );
    }
  }
}

export const {
  selectAll,
} = adapter.getSelectors();
