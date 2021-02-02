import {Fullcalendar} from '../../model/fullcalendars';
import {TourcalendarsActions, TourcalendarsActionTypes} from './tour-calendar.actions';

export interface CalendarState {
  isLoading: boolean;
  timestamp: number;
  values: {
    tours: Fullcalendar[]
  };
}

export const initialState: CalendarState = {
  isLoading: false,
  timestamp: 0,
  values: {
    tours: []
  }
};

export function reducer(state = initialState, action: TourcalendarsActions): CalendarState {
  switch (action.type) {

    case TourcalendarsActionTypes.RequestTourcalendars: {
      return {
        ... state,
        isLoading: true
      };
    }

    case TourcalendarsActionTypes.TourcalendarsNotModified: {
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    case TourcalendarsActionTypes.LoadTourcalendars: {
      return {
        ...state,
        values: action.payload,
        isLoading: false,
        timestamp: new Date().getTime()
      };
    }

    default:
      return state;
  }
}
