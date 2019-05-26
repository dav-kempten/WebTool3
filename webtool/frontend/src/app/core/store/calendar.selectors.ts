import {createFeatureSelector, createSelector} from "@ngrx/store";
import {CalendarState} from "./calendar.reducer";
import {Anniversary, Calendar, Vacation} from "../../model/calendar";
import {ValueState} from "./value.reducer";
import {getValues, getValueState} from "./value.selectors";
import {Anniversaries, Calendars, Vacations} from "./calendar.model";
import {Categories, States, Values} from "./value.model";
import {Category, State} from "../../model/value";

export const getCalendarState = createFeatureSelector<CalendarState>('calendar');

export const getCalendars = createSelector(getCalendarState, (state: CalendarState): Calendars => state.calendars);
export const getCalendarsIsLoading = createSelector(getCalendarState, (state: CalendarState): boolean => state.isLoading);
export const getCalendarsTimestamp = createSelector(getCalendarState, (state: CalendarState): number => state.timestamp);

export const getVacations = createSelector(getCalendars, (calendars: Calendars): Vacations => calendars.vacations);
export const getVacationById = createSelector(getVacations, (vacations: Vacations, props): Vacation => vacations[props.vacationId]);

export const getAnniversaries = createSelector(getCalendars, (calendars: Calendars): Anniversaries => calendars.anniversaries);
export const getAnniversaryById = createSelector(
  getAnniversaries, (anniversaries: Anniversaries, props): Anniversary => anniversaries[props.anniversaryId]
);
