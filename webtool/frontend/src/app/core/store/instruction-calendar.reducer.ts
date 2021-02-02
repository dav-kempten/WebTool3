import {Fullcalendar} from '../../model/fullcalendars';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {InstructioncalendarsActions, InstructioncalendarsActionTypes} from './instruction-calendar.actions';

export interface CalendarState {
  isLoading: boolean;
  timestamp: number;
  values: {
    instructions: Fullcalendar[]
  };
}

export const initialState: CalendarState = {
  isLoading: false,
  timestamp: 0,
  values: {
    instructions: []
  }
};

export function reducer(state = initialState, action: InstructioncalendarsActions): CalendarState {
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
      return {
        ... state,
        values: action.payload,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    default:
      return state;
  }
}
