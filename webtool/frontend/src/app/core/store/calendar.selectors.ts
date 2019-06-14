import {createFeatureSelector, createSelector} from '@ngrx/store';
import {CalendarState} from './calendar.reducer';
import {Anniversaries, Calendars, Vacations} from './calendar.model';

export const getCalendarState = createFeatureSelector<CalendarState>('calendar');

export const getCalendars = createSelector(getCalendarState, (state: CalendarState): Calendars => state.calendars);
export const getCalendarsIsLoading = createSelector(getCalendarState, (state: CalendarState): boolean => state.isLoading);
export const getCalendarsTimestamp = createSelector(getCalendarState, (state: CalendarState): number => state.timestamp);

export const getId = createSelector(getCalendars, (calendars: Calendars): number => calendars.id);

export const getYear = createSelector(getCalendars, (calendars: Calendars): number => calendars.year);

export const getVacations = createSelector(getCalendars, (calendars: Calendars): Vacations => calendars.vacations);

export const getAnniversaries = createSelector(getCalendars, (calendars: Calendars): Anniversaries => calendars.anniversaries);
