import {createFeatureSelector, createSelector} from '@ngrx/store';
import {CalendarState} from './instruction-calendar.reducer';
import {Fullcalendar} from '../../model/fullcalendars';
import {getTourCalendarState} from './tour-calendar.selectors';

export const getInstructionCalendarState = createFeatureSelector<CalendarState>('instructionCalendar');
export const getInstructionCalendar = createSelector(
  getInstructionCalendarState,
  (state: CalendarState): Fullcalendar[] => state.values.instructions
);

export const getInstructionIsLoading = createSelector(
  getInstructionCalendarState,
  (state: CalendarState): boolean => state.isLoading
);

export const getInstructionCalendarTimestamp = createSelector(
  getInstructionCalendarState,
  (state: CalendarState): number => state.timestamp
);
