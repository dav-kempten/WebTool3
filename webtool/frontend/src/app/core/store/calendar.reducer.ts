import {Anniversaries, Calendars, Vacations} from "./calendar.model";
import {Anniversary, Calendar, Vacation} from "../../model/calendar";
import {CalendarActions, CalendarActionTypes} from "./calendar.actions";


export interface CalendarState {
  isLoading: boolean;
  timestamp: number;
  calendars: Calendars;
}

export const initialState: CalendarState = {
  isLoading: false,
  timestamp: 0,
  calendars: null
};

/* Eventuell Transform-Funktion für Kalendarformate -/.
 * oder umformatieren amerikanisches/deutsches Datumsformat */


function transform (rawCalendar: Calendar | null): Calendars | null {
  if (rawCalendar) {
    return {
      id: rawCalendar.id,
      year: rawCalendar.year,
      anniversaries: rawCalendar.anniversaries.reduce(
        (anniversaries: Anniversaries, anniversary: Anniversary) => {anniversaries[anniversary.id] = anniversary; return anniversaries;}, {}
      ),
      vacations: rawCalendar.vacations.reduce(
        (vacations: Vacations, vacation: Vacation) => {vacations[vacation.id] = vacation; return vacations}, {}
      )
    };
  }
}

export function reducer(state: CalendarState = initialState, action: CalendarActions): CalendarState {
  switch (action.type) {
    case CalendarActionTypes.CalendarRequested:
      return {
        ... state,
        isLoading: true
      };
    case CalendarActionTypes.CalendarLoaded:
      return {
        ... state,
        calendars: transform(action.payload),
        isLoading: false,
        timestamp: new Date().getTime()
      };
    case CalendarActionTypes.CalendarNotModified:
      return {
        ... state,
        isLoading: false,
        timestamp: new Date().getTime(),
      };
    default:
      return state;
  }
}
