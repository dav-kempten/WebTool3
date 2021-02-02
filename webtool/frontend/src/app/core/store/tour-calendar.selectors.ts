import {createFeatureSelector, createSelector} from '@ngrx/store';
import {CalendarState} from './tour-calendar.reducer';
import {Fullcalendar} from '../../model/fullcalendars';


export const getTourCalendarState = createFeatureSelector<CalendarState>('tourCalendar');

export const getTourCalendar = createSelector(
  getTourCalendarState,
  (state: CalendarState): Fullcalendar[] => state.values.tours
);

export const getTourCalendarIsLoading = createSelector(
  getTourCalendarState,
  (state: CalendarState): boolean => state.isLoading
);

export const getTourCalendarTimestamp = createSelector(
  getTourCalendarState,
  (state: CalendarState): number => state.timestamp
);
